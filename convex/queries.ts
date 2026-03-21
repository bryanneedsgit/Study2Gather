import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const getBackendHealth = queryGeneric({
  args: {
    key: v.string()
  },
  handler: async (ctx, args) => {
    const email = `smoke-${args.key.replace(/[^a-z0-9-]/gi, "")}@study2gather.test`;
    const smoke = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    const allUsers = await ctx.db.query("users").collect();

    return {
      ok: true,
      message: "Convex query connected",
      count: smoke?.points ?? 0,
      totalUsers: allUsers.length
    };
  }
});
