import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const incrementTestCounter = mutationGeneric({
  args: {
    key: v.string()
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(q.eq(q.field("school"), "smoke-test"), q.eq(q.field("course"), args.key))
      )
      .first();

    if (!existing) {
      const id = await ctx.db.insert("users", {
        school: "smoke-test",
        course: args.key,
        age: 0,
        points_total: 1,
        tier_status: "bronze",
        created_at: Date.now()
      });
      return { next: 1, userId: id };
    }

    const next = existing.points_total + 1;
    await ctx.db.patch(existing._id, { points_total: next });
    return { next, userId: existing._id };
  }
});
