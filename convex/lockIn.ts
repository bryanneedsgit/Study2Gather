import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import {
  COOLDOWN_AFTER_CAP_MS,
  MAX_SESSION_MINUTES,
  POINTS_PER_ELIGIBLE_MINUTE,
  eligibleMinutesExcludingNightWindow,
  isInNoPointsNightWindowLocalHour,
  localHourFromUtcMs,
  pointsFromEligibleMinutes
} from "./rules";
import { userPointsBalance } from "./userPoints";

// --- Queries: LOCK-IN ---

export const validateSessionEligibility = queryGeneric({
  args: {
    userId: v.id("users"),
    groupId: v.optional(v.id("study_groups")),
    nowMs: v.number(),
    timezoneOffsetMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { eligible: false, reasons: ["user_not_found"] as const, groupSize: 0 };
    }

    const reasons: string[] = [];

    if (user.cooldown_until !== undefined && args.nowMs < user.cooldown_until) {
      reasons.push("cooldown_active");
    }

    const hour = localHourFromUtcMs(args.nowMs, args.timezoneOffsetMinutes);
    if (isInNoPointsNightWindowLocalHour(hour)) {
      reasons.push("night_window_no_start");
    }

    let groupSize = 0;
    if (args.groupId) {
      const members = await ctx.db
        .query("study_group_members")
        .withIndex("by_group", (q) => q.eq("group_id", args.groupId!))
        .collect();
      groupSize = members.length;
      if (groupSize < 2) {
        reasons.push("group_too_small");
      }
    }

    return {
      eligible: reasons.length === 0,
      reasons,
      groupSize,
      cooldownUntil: user.cooldown_until,
      localHour: hour
    };
  }
});

/** Returns rule constants + computed eligibility snapshot (read-only). */
export const enforceRules = queryGeneric({
  args: {
    userId: v.id("users"),
    nowMs: v.number(),
    timezoneOffsetMinutes: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const hour = localHourFromUtcMs(args.nowMs, args.timezoneOffsetMinutes);
    return {
      pointsPerEligibleMinute: POINTS_PER_ELIGIBLE_MINUTE,
      maxSessionMinutes: MAX_SESSION_MINUTES,
      cooldownAfterCapMs: COOLDOWN_AFTER_CAP_MS,
      nightWindowLocalHours: { start: 0, end: 6 },
      cooldownUntil: user?.cooldown_until,
      inNightWindow: isInNoPointsNightWindowLocalHour(hour),
      localHour: hour
    };
  }
});

// --- Mutations: LOCK-IN ---

export const startStudySession = mutationGeneric({
  args: {
    groupId: v.id("study_groups"),
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

    const members = await ctx.db
      .query("study_group_members")
      .withIndex("by_group", (q) => q.eq("group_id", args.groupId))
      .collect();

    if (members.length < 2) {
      throw new Error("group_too_small");
    }

    const memberOf = members.some((m) => m.user_id === args.userId);
    if (!memberOf) throw new Error("user_not_in_group");

    const active = await ctx.db
      .query("study_sessions")
      .filter((q) =>
        q.and(
          q.eq(q.field("group_id"), args.groupId),
          q.eq(q.field("status"), "active")
        )
      )
      .first();
    if (active) throw new Error("group_already_has_active_session");

    const sessionId = await ctx.db.insert("study_sessions", {
      group_id: args.groupId,
      started_at: args.nowMs,
      status: "active",
      duration_minutes: 0,
      points_awarded: 0
    });

    for (const m of members) {
      await ctx.db.insert("session_participants", {
        session_id: sessionId,
        user_id: m.user_id,
        app_foreground_ok: false,
        proximity_ok: false,
        checked_in_at: args.nowMs,
        last_seen_at: args.nowMs
      });
    }

    return { sessionId };
  }
});

export const updateSessionParticipantFlags = mutationGeneric({
  args: {
    sessionId: v.id("study_sessions"),
    userId: v.id("users"),
    appForegroundOk: v.boolean(),
    proximityOk: v.boolean(),
    nowMs: v.number()
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("session_participants")
      .filter((q) =>
        q.and(
          q.eq(q.field("session_id"), args.sessionId),
          q.eq(q.field("user_id"), args.userId)
        )
      )
      .first();
    if (!row) throw new Error("participant_not_found");

    await ctx.db.patch(row._id, {
      app_foreground_ok: args.appForegroundOk,
      proximity_ok: args.proximityOk,
      last_seen_at: args.nowMs
    });
    return { ok: true as const };
  }
});

export const completeSession = mutationGeneric({
  args: {
    sessionId: v.id("study_sessions"),
    endedAtMs: v.number(),
    timezoneOffsetMinutes: v.number(),
    endedReason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("session_not_found");
    if (session.status !== "active") throw new Error("session_not_active");

    const participants = await ctx.db
      .query("session_participants")
      .withIndex("by_session", (q) => q.eq("session_id", args.sessionId))
      .collect();

    for (const p of participants) {
      if (!p.app_foreground_ok || !p.proximity_ok) {
        throw new Error("participant_requirements_not_met");
      }
    }

    const rawMs = args.endedAtMs - session.started_at;
    if (rawMs <= 0) throw new Error("invalid_end_time");

    const cappedMs = Math.min(rawMs, MAX_SESSION_MINUTES * 60 * 1000);
    const durationMinutes = Math.floor(cappedMs / 60000);

    const eligibleMinutes = eligibleMinutesExcludingNightWindow(
      session.started_at,
      args.endedAtMs,
      args.timezoneOffsetMinutes
    );
    const points = pointsFromEligibleMinutes(eligibleMinutes);

    await ctx.db.patch(args.sessionId, {
      ended_at: args.endedAtMs,
      status: "completed",
      duration_minutes: durationMinutes,
      points_awarded: points,
      ended_reason: args.endedReason
    });

    const hitSessionCap = rawMs >= MAX_SESSION_MINUTES * 60 * 1000;
    const cooldownUntil = args.endedAtMs + COOLDOWN_AFTER_CAP_MS;

    for (const p of participants) {
      const u = await ctx.db.get(p.user_id);
      if (!u) continue;
      await ctx.db.patch(p.user_id, {
        points: userPointsBalance(u) + points,
        ...(hitSessionCap ? { cooldown_until: cooldownUntil } : {})
      });
    }

    return { pointsPerParticipant: points, participantCount: participants.length, durationMinutes };
  }
});
