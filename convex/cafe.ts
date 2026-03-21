import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { FOOTFALL_LOW_THRESHOLD, TUTOR_REWARD_POINTS } from "./rules";

function usedCapacity(
  cafe: { total_stipulated_tables: number; current_occupied_tables: number },
  activeHoldCount: number
): number {
  return cafe.current_occupied_tables + activeHoldCount;
}

function availableSeats(
  cafe: { total_stipulated_tables: number; current_occupied_tables: number },
  activeHoldCount: number
): number {
  return Math.max(0, cafe.total_stipulated_tables - usedCapacity(cafe, activeHoldCount));
}

async function countActiveSeatHoldsForCafe(
  ctx: { db: { query: (table: "cafe_seat_holds") => any } },
  cafeId: string,
  nowMs: number
): Promise<number> {
  const holds = await ctx.db
    .query("cafe_seat_holds")
    .withIndex("by_cafe", (q: any) => q.eq("cafe_id", cafeId))
    .collect();
  return holds.filter((h: any) => h.status === "active" && h.expires_at > nowMs).length;
}

// --- Queries: CAFE ---

export const checkCafeAvailability = queryGeneric({
  args: {
    cafeId: v.id("cafe_locations"),
    nowMs: v.number()
  },
  handler: async (ctx, args) => {
    const cafe = await ctx.db.get(args.cafeId);
    if (!cafe) return null;

    const activeHolds = await countActiveSeatHoldsForCafe(ctx, args.cafeId, args.nowMs);
    const used = usedCapacity(cafe, activeHolds);
    const avail = availableSeats(cafe, activeHolds);

    return {
      cafeId: args.cafeId,
      total_stipulated_tables: cafe.total_stipulated_tables,
      current_occupied_tables: cafe.current_occupied_tables,
      active_holds: activeHolds,
      used_capacity: used,
      available_seats: avail,
      can_transact: avail > 0,
      reduce_margin: cafe.footfall_metric <= FOOTFALL_LOW_THRESHOLD
    };
  }
});

// --- Mutations: CAFE ---

export const createSeatHold = mutationGeneric({
  args: {
    cafeId: v.id("cafe_locations"),
    userId: v.id("users"),
    nowMs: v.number()
  },
  handler: async (ctx, args) => {
    const cafe = await ctx.db.get(args.cafeId);
    if (!cafe) throw new Error("cafe_not_found");

    const activeHolds = await countActiveSeatHoldsForCafe(ctx, args.cafeId, args.nowMs);
    if (usedCapacity(cafe, activeHolds) >= cafe.total_stipulated_tables) {
      throw new Error("cafe_full");
    }

    const holdId = await ctx.db.insert("cafe_seat_holds", {
      cafe_id: args.cafeId,
      user_id: args.userId,
      expires_at: args.nowMs + 5 * 60 * 1000,
      status: "active"
    });

    return { holdId, expiresAt: args.nowMs + 5 * 60 * 1000 };
  }
});

export const finalizeCouponPurchase = mutationGeneric({
  args: {
    seatHoldId: v.id("cafe_seat_holds"),
    userId: v.id("users"),
    nowMs: v.number(),
    amountPaid: v.number(),
    reservationDurationMs: v.optional(v.number()),
    pricingMode: v.optional(
      v.union(v.literal("standard"), v.literal("competitive_rate"))
    ),
    tutorUserId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const hold = await ctx.db.get(args.seatHoldId);
    if (!hold) throw new Error("hold_not_found");
    if (hold.user_id !== args.userId) throw new Error("hold_user_mismatch");
    if (hold.status !== "active") throw new Error("hold_not_active");
    if (hold.expires_at <= args.nowMs) {
      await ctx.db.patch(hold._id, { status: "expired" });
      throw new Error("hold_expired");
    }

    const cafe = await ctx.db.get(hold.cafe_id);
    if (!cafe) throw new Error("cafe_not_found");

    const activeHolds = await countActiveSeatHoldsForCafe(ctx, hold.cafe_id, args.nowMs);
    const holdsWithoutThis = Math.max(0, activeHolds - 1);
    const used = usedCapacity(cafe, holdsWithoutThis);
    if (used >= cafe.total_stipulated_tables) {
      throw new Error("cafe_full");
    }

    const marginReduced = cafe.footfall_metric <= FOOTFALL_LOW_THRESHOLD;
    const duration = args.reservationDurationMs ?? 2 * 60 * 60 * 1000;
    const start = args.nowMs;
    const end = args.nowMs + duration;

    const reservationId = await ctx.db.insert("reservations", {
      user_id: args.userId,
      cafe_id: hold.cafe_id,
      seat_hold_id: hold._id,
      start_time: start,
      end_time: end,
      status: "confirmed",
      is_verified: false
    });

    const pricingMode = args.pricingMode ?? "standard";

    const couponId = await ctx.db.insert("coupon_purchases", {
      user_id: args.userId,
      cafe_id: hold.cafe_id,
      reservation_id: reservationId,
      amount_paid: args.amountPaid,
      margin_reduced: marginReduced,
      status: "paid",
      purchased_at: args.nowMs,
      pricing_mode: pricingMode,
      tutor_user_id: args.tutorUserId
    });

    await ctx.db.patch(reservationId, { coupon_purchase_id: couponId });

    await ctx.db.patch(hold._id, { status: "converted" });

    await ctx.db.patch(cafe._id, {
      current_occupied_tables: cafe.current_occupied_tables + 1
    });

    if (pricingMode === "competitive_rate" && args.tutorUserId) {
      const tutor = await ctx.db.get(args.tutorUserId);
      if (tutor) {
        await ctx.db.patch(args.tutorUserId, {
          points_total: tutor.points_total + TUTOR_REWARD_POINTS
        });
      }
    }

    return {
      reservationId,
      couponId,
      marginReduced,
      tutorRewarded:
        pricingMode === "competitive_rate" && args.tutorUserId !== undefined
    };
  }
});

export const releaseExpiredSeatHolds = mutationGeneric({
  args: {
    nowMs: v.number()
  },
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query("cafe_seat_holds")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.lt(q.field("expires_at"), args.nowMs)
        )
      )
      .collect();

    let released = 0;
    for (const h of expired) {
      await ctx.db.patch(h._id, { status: "expired" });
      released++;
    }
    return { released };
  }
});

export const verifyCafePresence = mutationGeneric({
  args: {
    reservationId: v.id("reservations")
  },
  handler: async (ctx, args) => {
    const res = await ctx.db.get(args.reservationId);
    if (!res) throw new Error("reservation_not_found");

    await ctx.db.patch(args.reservationId, {
      is_verified: true,
      status: "completed"
    });

    return { ok: true as const };
  }
});
