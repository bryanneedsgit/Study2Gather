/**
 * Solo lock-in: one user, focus session with points from `rules.ts` (same mapping as group sessions).
 * Requires a valid `lock_in_location_check_ins` row (QR + GPS) until consumed — see `locationCheckIn.ts`.
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  COOLDOWN_AFTER_CAP_MS,
  MAX_SESSION_MINUTES,
  POINTS_PER_ELIGIBLE_SECOND,
  eligibleMsExcludingNightWindow,
  isInNoPointsNightWindowLocalHour,
  localHourFromUtcMs,
  pointsFromEligibleMs
} from "./rules";
import { userPointsBalance } from "./userPoints";

/** Public mapping for UI + web clients (duration → points formula). */
export const getLockInPointsPolicy = queryGeneric({
  args: {},
  handler: async () => {
    return {
      pointsPerEligibleSecond: POINTS_PER_ELIGIBLE_SECOND,
      maxSessionMinutes: MAX_SESSION_MINUTES,
      cooldownAfterCapHours: COOLDOWN_AFTER_CAP_MS / (60 * 60 * 1000),
      nightWindowLocalHours: { start: 0, end: 6 },
      description:
        "Earn 1 point per full second of eligible time (raw stopwatch ms outside 00:00–06:00 local). Example: 1m 6s → 66 points. Sessions longer than maxSessionMinutes cap for points."
    };
  }
});

export const getActiveSoloLockIn = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const rows = await ctx.db
      .query("lock_in_sessions")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    return rows[0] ?? null;
  }
});

export const startSoloLockIn = mutationGeneric({
  args: {
    nowMs: v.number(),
    timezoneOffsetMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("user_not_found");

    if (user.cooldown_until !== undefined && args.nowMs < user.cooldown_until) {
      throw new Error("cooldown_active");
    }

    const hour = localHourFromUtcMs(args.nowMs, args.timezoneOffsetMinutes);
    if (isInNoPointsNightWindowLocalHour(hour)) {
      throw new Error("night_window_no_start");
    }

    const checkInRows = await ctx.db
      .query("lock_in_location_check_ins")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let validCheckIn: (typeof checkInRows)[0] | null = null;
    for (const row of checkInRows) {
      if (row.expires_at <= args.nowMs) {
        await ctx.db.patch(row._id, { status: "expired" });
        continue;
      }
      validCheckIn = row;
      break;
    }
    if (!validCheckIn) throw new Error("location_check_in_required");

    const existingRows = await ctx.db
      .query("lock_in_sessions")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    const existing = existingRows[0];
    if (existing) throw new Error("already_locked_in");

    const venueId = validCheckIn.study_spot_id ?? validCheckIn.cafe_id;
    const sessionId = await ctx.db.insert("lock_in_sessions", {
      user_id: userId,
      ...(venueId !== undefined ? { location_id: venueId as string } : {}),
      started_at: args.nowMs,
      status: "active",
      duration_minutes: 0,
      points_awarded: 0,
      timezone_offset_minutes: args.timezoneOffsetMinutes
    });

    await ctx.db.patch(validCheckIn._id, { status: "consumed" });

    return { sessionId };
  }
});

export const endSoloLockIn = mutationGeneric({
  args: {
    sessionId: v.id("lock_in_sessions"),
    endedAtMs: v.number(),
    timezoneOffsetMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("session_not_found");
    if (session.user_id !== userId) throw new Error("forbidden");
    if (session.status !== "active") throw new Error("session_not_active");

    const rawMs = args.endedAtMs - session.started_at;
    if (rawMs <= 0) throw new Error("invalid_end_time");

    const cappedMs = Math.min(rawMs, MAX_SESSION_MINUTES * 60 * 1000);
    const durationMinutes = Math.floor(cappedMs / 60000);

    const eligibleMs = eligibleMsExcludingNightWindow(
      session.started_at,
      args.endedAtMs,
      args.timezoneOffsetMinutes
    );
    const points = pointsFromEligibleMs(eligibleMs);

    await ctx.db.patch(args.sessionId, {
      ended_at: args.endedAtMs,
      status: "completed",
      duration_minutes: durationMinutes,
      points_awarded: points
    });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("user_not_found");

    const hitSessionCap = rawMs >= MAX_SESSION_MINUTES * 60 * 1000;
    const cooldownUntil = args.endedAtMs + COOLDOWN_AFTER_CAP_MS;

    await ctx.db.patch(userId, {
      points: (user.points ?? 0) + points,
      ...(hitSessionCap ? { cooldown_until: cooldownUntil } : {})
    });

    return {
      pointsAwarded: points,
      durationMinutes,
      pointsPerEligibleSecond: POINTS_PER_ELIGIBLE_SECOND,
      eligibleMsCounted: eligibleMs,
      eligibleSecondsCounted: Math.floor(eligibleMs / 1000)
    };
  }
});
