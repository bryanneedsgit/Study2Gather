/**
 * Study session lifecycle (container only).
 * No cooldown, blackout, foreground, or proximity — layer `lockIn` rules on top later
 * (e.g. call validateSessionEligibility, then startSession, or wrap in a composed mutation).
 */
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const terminalStatus = v.union(v.literal("completed"), v.literal("failed"));

function nowMs(args: { nowMs?: number }): number {
  return args.nowMs ?? Date.now();
}

export const startSession = mutationGeneric({
  args: {
    groupId: v.id("study_groups"),
    /** Default `active`. Use `pending` when you want a reserved slot before the clock starts (call `activateSession`). */
    initialStatus: v.optional(v.union(v.literal("pending"), v.literal("active"))),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = nowMs(args);
    const status = args.initialStatus ?? "active";
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("group_not_found");

    const groupSessions = await ctx.db
      .query("study_sessions")
      .withIndex("by_group", (q) => q.eq("group_id", args.groupId))
      .collect();
    const open = groupSessions.find((s) => s.status === "pending" || s.status === "active");
    if (open) {
      throw new Error("group_already_has_open_session");
    }

    const sessionId = await ctx.db.insert("study_sessions", {
      group_id: args.groupId,
      started_at: t,
      status,
      duration_minutes: 0,
      points_awarded: 0
    });

    return { sessionId };
  }
});

export const getSession = queryGeneric({
  args: {
    sessionId: v.id("study_sessions")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  }
});

export const getActiveSessionByGroup = queryGeneric({
  args: {
    groupId: v.id("study_groups")
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("study_sessions")
      .withIndex("by_group", (q) => q.eq("group_id", args.groupId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
  }
});

export const endSession = mutationGeneric({
  args: {
    sessionId: v.id("study_sessions"),
    status: terminalStatus,
    endedReason: v.optional(v.string()),
    nowMs: v.optional(v.number()),
    /** Optional; defaults to 0 until lock-in points logic exists */
    pointsAwarded: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = nowMs(args);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("session_not_found");

    if (session.status !== "pending" && session.status !== "active") {
      throw new Error("session_already_closed");
    }

    const endedAt = t;
    const durationMs = Math.max(0, endedAt - session.started_at);
    const durationMinutes = Math.floor(durationMs / 60000);

    await ctx.db.patch(args.sessionId, {
      ended_at: endedAt,
      status: args.status,
      duration_minutes: durationMinutes,
      points_awarded: args.pointsAwarded ?? 0,
      ended_reason: args.endedReason
    });

    return { ok: true as const };
  }
});

/**
 * pending → active. Sets `started_at` to now so duration reflects real study start.
 * Lock-in rules can wrap or call this after validation.
 */
export const activateSession = mutationGeneric({
  args: {
    sessionId: v.id("study_sessions"),
    nowMs: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = nowMs(args);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("session_not_found");
    if (session.status !== "pending") throw new Error("session_not_pending");

    await ctx.db.patch(args.sessionId, {
      status: "active",
      started_at: t
    });

    return { ok: true as const };
  }
});
