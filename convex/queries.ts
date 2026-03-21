import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getBackendHealth = queryGeneric({
  args: {
    key: v.string()
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("testCounters")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    return {
      ok: true,
      message: "Convex query connected",
      count: doc?.count ?? 0
    };
  }
});
