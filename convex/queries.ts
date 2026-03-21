import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getBackendHealth = queryGeneric({
  args: {
    key: v.string()
  },
  handler: async (ctx, args) => {
    const smoke = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(q.eq(q.field("school"), "smoke-test"), q.eq(q.field("course"), args.key))
      )
      .first();

    const allUsers = await ctx.db.query("users").collect();

    return {
      ok: true,
      message: "Convex query connected",
      count: smoke?.points_total ?? 0,
      totalUsers: allUsers.length
    };
  }
});
