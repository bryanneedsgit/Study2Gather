/**
 * Collaboration recommendations from n8n.
 * Accepts HTTP POST with userMatches (array of { user_id, matches }), totalUsers (count), timestamps.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { internalMutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const userWithMatchesValidator = v.object({
  user_id: v.string(),
  matches: v.array(v.string())
});

/** Recommendations for the current user with resolved user profiles. */
export const getRecommendationsForCurrentUser = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const latest = await ctx.db
      .query("collaboration_recommendations")
      .order("desc")
      .first();
    if (!latest) return null;

    const entry = latest.userMatches.find(
      (m: { user_id: string; matches: string[] }) => m.user_id === userId
    );
    if (!entry || entry.matches.length === 0) return null;

    const profiles: Array<{
      id: string;
      username?: string;
      school?: string;
      course?: string;
    }> = [];
    for (const matchId of entry.matches.slice(0, 3)) {
      const u = await ctx.db.get(matchId as Id<"users">);
      if (u) {
        profiles.push({
          id: matchId,
          username: u.username,
          school: u.school,
          course: u.course
        });
      }
    }
    return profiles;
  }
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
