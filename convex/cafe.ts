import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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
  cafeId: Id<"cafe_locations">,
  nowMs: number
): Promise<number> {
  const holds = await ctx.db
    .query("cafe_seat_holds")
    .withIndex("by_cafe", (q: any) => q.eq("cafe_id", cafeId))
    .collect();
  return holds.filter((h: any) => h.status === "active" && h.expires_at > nowMs).length;
}

/** True if this user already has a non-expired active hold at this cafe. */
async function userHasActiveHoldAtCafe(
  ctx: { db: { query: (table: "cafe_seat_holds") => any } },
  userId: Id<"users">,
  cafeId: Id<"cafe_locations">,
  nowMs: number
): Promise<boolean> {
  const holds = await ctx.db
    .query("cafe_seat_holds")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .collect();
  return holds.some(
    (h: any) =>
      h.cafe_id === cafeId && h.status === "active" && h.expires_at > nowMs
  );
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
    const isFull = avail <= 0;

    return {
      cafeId: args.cafeId,
      total_stipulated_tables: cafe.total_stipulated_tables,
      current_occupied_tables: cafe.current_occupied_tables,
      footfall_metric: cafe.footfall_metric,
      // Stored flag on `cafe_locations` (see schema).
      reduce_margin: cafe.reduce_margin,
      // Same heuristic as `finalizeCouponPurchase` for `margin_reduced` on coupons.
      margin_reduced_by_footfall: cafe.footfall_metric <= FOOTFALL_LOW_THRESHOLD,
      active_holds: activeHolds,
      used_capacity: used,
      available_seats: avail,
      is_full: isFull,
      can_transact: avail > 0
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

    if (await userHasActiveHoldAtCafe(ctx, args.userId, args.cafeId, args.nowMs)) {
      throw new Error("user_already_has_active_hold");
    }

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

    /*
     * Race-safety (hackathon): two mutations can both pass the pre-check before either insert.
     * Re-count after insert; if we exceeded capacity, cancel THIS hold so total never overshoots.
     * Convex does not give us cross-row locks; this is the safest cheap pattern here.
     */
    const activeAfter = await countActiveSeatHoldsForCafe(ctx, args.cafeId, args.nowMs);
    if (usedCapacity(cafe, activeAfter) > cafe.total_stipulated_tables) {
      await ctx.db.patch(holdId, { status: "cancelled" });
      throw new Error("cafe_full");
    }

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

    /*
     * Occupancy bump: hold was already counted in `usedCapacity`; converting removes one active
     * hold and adds one occupied seat — net `used` unchanged if math is consistent.
     * Concurrent `finalizeCouponPurchase` calls can still race on `current_occupied_tables`
     * (lost update). Mitigation for production: internal mutation queue, OCC retries, or derive
     * occupancy from reservations. Here we use a single read-modify-write; hackathon acceptable.
     */
    const cafeForBump = await ctx.db.get(hold.cafe_id);
    if (!cafeForBump) throw new Error("cafe_not_found");
    await ctx.db.patch(cafeForBump._id, {
      current_occupied_tables: cafeForBump.current_occupied_tables + 1
    });
    const cafeAfterBump = await ctx.db.get(hold.cafe_id);
    if (cafeAfterBump && cafeAfterBump.current_occupied_tables > cafeAfterBump.total_stipulated_tables) {
      await ctx.db.patch(cafeAfterBump._id, {
        current_occupied_tables: cafeAfterBump.total_stipulated_tables
      });
    }

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
    if (res.status === "cancelled") {
      throw new Error("reservation_cancelled");
    }

    await ctx.db.patch(args.reservationId, {
      is_verified: true
    });

    return { ok: true as const };
  }
});
