/**
 * Solo lock-in: one user, focus session with points from `rules.ts` (same mapping as group sessions).
 */
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  COOLDOWN_AFTER_CAP_MS,
  MAX_SESSION_MINUTES,
  POINTS_PER_60_MIN,
  eligibleMinutesExcludingNightWindow,
  fullIntervalsFromMinutes,
  isInNoPointsNightWindowLocalHour,
  localHourFromUtcMs,
  pointsForIntervals
} from "./rules";
import { userPointsBalance } from "./userPoints";

/** Public mapping for UI + web clients (duration → points formula). */
export const getLockInPointsPolicy = queryGeneric({
  args: {},
  handler: async () => {
    return {
      pointsPerFullInterval: POINTS_PER_60_MIN,
      intervalMinutes: 60,
      maxSessionMinutes: MAX_SESSION_MINUTES,
      cooldownAfterCapHours: COOLDOWN_AFTER_CAP_MS / (60 * 60 * 1000),
      nightWindowLocalHours: { start: 0, end: 6 },
      description:
        "Earn points in full 60-minute blocks of eligible time. Time between 00:00–06:00 local earns no points. Sessions longer than maxSessionMinutes cap at that duration for points."
    };
  }
});

export const getActiveSoloLockIn = queryGeneric({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("lock_in_sessions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    return rows[0] ?? null;
  }
});

export const startSoloLockIn = mutationGeneric({
  args: {
    userId: v.id("users"),
    nowMs: v.number(),
    timezoneOffsetMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("user_not_found");

    if (user.cooldown_until !== undefined && args.nowMs < user.cooldown_until) {
      throw new Error("cooldown_active");
    }

    const hour = localHourFromUtcMs(args.nowMs, args.timezoneOffsetMinutes);
    if (isInNoPointsNightWindowLocalHour(hour)) {
      throw new Error("night_window_no_start");
    }

    const existingRows = await ctx.db
      .query("lock_in_sessions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const existing = existingRows[0];
    if (existing) throw new Error("already_locked_in");

    const sessionId = await ctx.db.insert("lock_in_sessions", {
      user_id: args.userId,
      started_at: args.nowMs,
      status: "active",
      duration_minutes: 0,
      points_awarded: 0,
      timezone_offset_minutes: args.timezoneOffsetMinutes
    });

    return { sessionId };
  }
});

export const endSoloLockIn = mutationGeneric({
  args: {
    sessionId: v.id("lock_in_sessions"),
    userId: v.id("users"),
    endedAtMs: v.number(),
    timezoneOffsetMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("session_not_found");
    if (session.user_id !== args.userId) throw new Error("forbidden");
    if (session.status !== "active") throw new Error("session_not_active");

    const rawMs = args.endedAtMs - session.started_at;
    if (rawMs <= 0) throw new Error("invalid_end_time");

    const cappedMs = Math.min(rawMs, MAX_SESSION_MINUTES * 60 * 1000);
    const durationMinutes = Math.floor(cappedMs / 60000);

    const eligibleMinutes = eligibleMinutesExcludingNightWindow(
      session.started_at,
      args.endedAtMs,
      args.timezoneOffsetMinutes
    );
    const intervals = fullIntervalsFromMinutes(eligibleMinutes);
    const points = pointsForIntervals(intervals);

    await ctx.db.patch(args.sessionId, {
      ended_at: args.endedAtMs,
      status: "completed",
      duration_minutes: durationMinutes,
      points_awarded: points
    });

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("user_not_found");

    const hitSessionCap = rawMs >= MAX_SESSION_MINUTES * 60 * 1000;
    const cooldownUntil = args.endedAtMs + COOLDOWN_AFTER_CAP_MS;

    await ctx.db.patch(args.userId, {
      points: userPointsBalance(user) + points,
      ...(hitSessionCap ? { cooldown_until: cooldownUntil } : {})
    });

    return {
      pointsAwarded: points,
      durationMinutes,
      pointsPerInterval: POINTS_PER_60_MIN,
      intervalsEarned: intervals
    };
  }
});
