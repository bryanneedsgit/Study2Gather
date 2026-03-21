/**
 * Rewards catalog + point adjustments + redemptions.
 * Balance of truth for total points remains `users.points` (shared with lock-in / cafe until migrated).
 */
import type { GenericMutationCtx } from "convex/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";

type MutationCtx = GenericMutationCtx<DataModel>;

function nowMs(args: { nowMs?: number }): number {
  return args.nowMs ?? Date.now();
}

function assertPositiveIntegerAmount(n: number, field: string): void {
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error(`invalid_${field}`);
  }
}

/**
 * Applies a signed delta to `users.points` and appends `points_ledger`.
 * Convex does not provide row locks; concurrent direct patches elsewhere can still race — prefer routing
 * all balance changes through this module over time for consistency.
 */
async function applyPointsDelta(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    delta: number;
    reason?: string;
    at: number;
  }
): Promise<{ balanceAfter: number }> {
  if (args.delta === 0) {
    throw new Error("invalid_delta");
  }
  const user = await ctx.db.get(args.userId);
  if (!user) {
    throw new Error("user_not_found");
  }
  const current = user.points ?? 0;
  const next = current + args.delta;
  if (next < 0) {
    throw new Error("insufficient_points");
  }
  await ctx.db.patch(args.userId, { points: next });
  await ctx.db.insert("points_ledger", {
    user_id: args.userId,
    delta: args.delta,
    reason: args.reason,
    balance_after: next,
    created_at: args.at
  });
  return { balanceAfter: next };
}

export const addPoints = mutationGeneric({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.optional(v.string()),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertPositiveIntegerAmount(args.amount, "amount");
    const t = nowMs(args);
    return await applyPointsDelta(ctx, {
      userId: args.userId,
      delta: args.amount,
      reason: args.reason,
      at: t
    });
  }
});

export const deductPoints = mutationGeneric({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.optional(v.string()),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertPositiveIntegerAmount(args.amount, "amount");
    const t = nowMs(args);
    return await applyPointsDelta(ctx, {
      userId: args.userId,
      delta: -args.amount,
      reason: args.reason,
      at: t
    });
  }
});

export const getUserPoints = queryGeneric({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return { pointsTotal: user.points ?? 0 };
  }
});

export const getAvailableRewards = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("reward_catalog")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    rows.sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title);
    });
    return rows.map((r) => ({
      _id: r._id,
      title: r.title,
      description: r.description,
      cost_points: r.cost_points,
      sort_order: r.sort_order
    }));
  }
});

export const redeemReward = mutationGeneric({
  args: {
    userId: v.id("users"),
    rewardId: v.id("reward_catalog"),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = nowMs(args);
    const reward = await ctx.db.get(args.rewardId);
    if (!reward) {
      return { ok: false as const, reason: "reward_not_found" as const };
    }
    if (!reward.active) {
      return { ok: false as const, reason: "reward_inactive" as const };
    }
    if (!Number.isInteger(reward.cost_points) || reward.cost_points <= 0) {
      return { ok: false as const, reason: "invalid_reward_cost" as const };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { ok: false as const, reason: "user_not_found" as const };
    }
    if ((user.points ?? 0) < reward.cost_points) {
      return { ok: false as const, reason: "insufficient_points" as const };
    }

    let balanceAfter: number;
    try {
      const r = await applyPointsDelta(ctx, {
        userId: args.userId,
        delta: -reward.cost_points,
        reason: `redeem:${args.rewardId}`,
        at: t
      });
      balanceAfter = r.balanceAfter;
    } catch (e) {
      if (e instanceof Error && e.message === "insufficient_points") {
        return { ok: false as const, reason: "insufficient_points" as const };
      }
      throw e;
    }

    const redemptionId = await ctx.db.insert("reward_redemptions", {
      user_id: args.userId,
      reward_id: args.rewardId,
      points_spent: reward.cost_points,
      status: "completed",
      created_at: t
    });

    return {
      ok: true as const,
      redemptionId,
      balanceAfter
    };
  }
});

/**
 * One-time (idempotent) seed for the rewards catalog — German / EU student & young-adult context.
 * Inspired by common perks (Mensa, Deutsche Bahn, Lieferando, dm, Kino, sustainability apps).
 * Run from Convex dashboard: `rewards:seedGermanStudentRewardCatalog` — skips if any catalog row exists.
 */
export const seedGermanStudentRewardCatalog = mutationGeneric({
  args: {
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = nowMs(args);
    const existing = await ctx.db.query("reward_catalog").first();
    if (existing) {
      return {
        ok: false as const,
        reason: "catalog_already_seeded" as const,
        hint: "Clear reward_catalog in the dashboard to run again."
      };
    }

    const items: {
      title: string;
      description: string;
      cost_points: number;
      sort_order: number;
    }[] = [
      {
        title: "Mensa Kaffee + Kuchen",
        description:
          "Credit for a coffee and cake at your uni Mensa — the classic German study break.",
        cost_points: 120,
        sort_order: 10
      },
      {
        title: "Döner / Falafel Spot (€5)",
        description:
          "Voucher toward a Döner or Falafel — Berlin-style fuel for late study sessions.",
        cost_points: 180,
        sort_order: 20
      },
      {
        title: "Too Good To Go surprise bag",
        description:
          "Rescue food from a local bakery or café — popular in Germany & the EU for saving money and waste.",
        cost_points: 150,
        sort_order: 30
      },
      {
        title: "Lieferando / Wolt delivery credit (€5)",
        description:
          "Order in when the library closes — food-delivery credit valid where supported in DE/EU.",
        cost_points: 220,
        sort_order: 40
      },
      {
        title: "dm Drogerie €5 voucher",
        description:
          "Skincare, snacks, or drugstore essentials — dm is a Gen‑Z favourite in Germany.",
        cost_points: 200,
        sort_order: 50
      },
      {
        title: "REWE / Edeka grocery €5",
        description:
          "Stock up for exam week — supermarket credit at major German chains.",
        cost_points: 200,
        sort_order: 60
      },
      {
        title: "Kino ticket (CineStar / Yorck)",
        description:
          "One standard cinema ticket — Kulturprogramm for a night off from studying.",
        cost_points: 420,
        sort_order: 70
      },
      {
        title: "Deutsche Bahn / FlixBus travel credit (€10)",
        description:
          "Put toward a train or long-distance bus home — mobility is huge for students in Europe.",
        cost_points: 850,
        sort_order: 80
      },
      {
        title: "Spotify Premium (1 month, student)",
        description:
          "Focus playlists or party mode — matches typical DE student pricing tier.",
        cost_points: 480,
        sort_order: 90
      },
      {
        title: "Urban Sports Club day pass",
        description:
          "Try gyms, pools, or climbing in your city — flexible fitness is trending with young adults in DE.",
        cost_points: 550,
        sort_order: 100
      },
      {
        title: "Museum / exhibition day pass",
        description:
          "State museums or a blockbuster exhibition — weekend culture fix (many EU cities).",
        cost_points: 380,
        sort_order: 110
      },
      {
        title: "Sustainable fashion voucher (€10)",
        description:
          "Toward eco labels popular in Germany (e.g. fair fashion) — aligns with Gen‑Z values.",
        cost_points: 720,
        sort_order: 120
      },
      {
        title: "Weihnachtsmarkt Glühwein + snack",
        description:
          "Seasonal treat — mulled wine and something warm at a German Christmas market.",
        cost_points: 160,
        sort_order: 130
      }
    ];

    const ids: Id<"reward_catalog">[] = [];
    for (const row of items) {
      const id = await ctx.db.insert("reward_catalog", {
        title: row.title,
        description: row.description,
        cost_points: row.cost_points,
        active: true,
        created_at: t,
        sort_order: row.sort_order
      });
      ids.push(id);
    }

    return { ok: true as const, inserted: ids.length, ids };
  }
});
