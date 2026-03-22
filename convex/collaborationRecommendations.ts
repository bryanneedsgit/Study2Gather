/**
 * Collaboration recommendations from n8n.
 * Accepts HTTP POST with userMatches (array of { user_id, matches }), totalUsers (count), timestamps.
 */
import { internalMutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const userWithMatchesValidator = v.object({
  user_id: v.string(),
  matches: v.array(v.string())
});

/** Fetch latest recommendations (newest first). Use in app or Convex dashboard. */
export const getLatest = queryGeneric({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    return await ctx.db
      .query("collaboration_recommendations")
      .order("desc")
      .take(limit);
  }
});

/**
 * Save n8n payload. userMatches = array of { user_id, matches }; totalUsers = count.
 */
export const saveFromN8n = internalMutationGeneric({
  args: {
    userMatches: v.array(userWithMatchesValidator),
    totalUsers: v.optional(v.number()),
    timestamps: v.union(v.number(), v.array(v.number()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("collaboration_recommendations", {
      userMatches: args.userMatches,
      totalUsers: args.totalUsers,
      timestamps: args.timestamps,
      created_at: now
    });
    return { ok: true };
  }
});
