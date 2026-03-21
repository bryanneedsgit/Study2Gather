/**
 * Queries for `lock_in_sessions` (e.g. HTTP / n8n integrations).
 */
import { queryGeneric } from "convex/server";
import { v } from "convex/values";

/** Latest rows by `_creationTime` (newest first). */
export const getLatestEntries = queryGeneric({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    return await ctx.db.query("lock_in_sessions").order("desc").take(limit);
  }
});
