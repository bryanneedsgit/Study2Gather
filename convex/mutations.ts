import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

export const incrementTestCounter = mutationGeneric({
  args: {
    key: v.string()
  },
  handler: async (ctx, args) => {
    const email = `smoke-${args.key.replace(/[^a-z0-9-]/gi, "")}@study2gather.test`;
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    if (!existing) {
      const email = `smoke-${args.key.replace(/[^a-z0-9-]/gi, "")}@study2gather.test`;
      const id = await ctx.db.insert("users", {
        email,
        school: "smoke-test",
        course: args.key,
        age: 18,
        onboarding_completed: true,
        points: 1,
        tier_status: "bronze",
        created_at: Date.now()
      });
      return { next: 1, userId: id };
    }

    const next = (existing.points ?? 0) + 1;
    await ctx.db.patch(existing._id, { points: next });
    return { next, userId: existing._id };
  }
});
