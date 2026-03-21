import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const incrementTestCounter = mutationGeneric({
  args: {
    key: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("testCounters")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!existing) {
      await ctx.db.insert("testCounters", { key: args.key, count: 1 });
      return 1;
    }

    const next = existing.count + 1;
    await ctx.db.patch(existing._id, { count: next });
    return next;
  }
});
