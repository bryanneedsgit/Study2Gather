/**
 * Monthly leaderboard (hackathon MVP): **only** completed `study_sessions` in the UTC month window.
 * Does **not** use `users.points` for ranking (lifetime balance is unrelated to monthly competition).
 *
 * Per user (via `session_participants`):
 * - monthlyPoints = sum of `points_awarded` on each completed session they joined
 * - monthlyMinutes = sum of `duration_minutes` on those sessions
 * - completedSessions = count of those sessions
 *
 * Rank: monthlyPoints desc → monthlyMinutes desc → completedSessions desc.
 */
import type { GenericQueryCtx } from "convex/server";
import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";

function monthBoundsUtc(
  nowMs: number,
  yearMonth?: string
): { startMs: number; endMs: number; yearMonthLabel: string } {
  if (yearMonth) {
    const parts = yearMonth.split("-");
    if (parts.length !== 2) throw new Error("invalid_year_month");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
      throw new Error("invalid_year_month");
    }
    const startMs = Date.UTC(y, m - 1, 1, 0, 0, 0, 0);
    const endMs = Date.UTC(y, m, 1, 0, 0, 0, 0);
    return { startMs, endMs, yearMonthLabel: `${y}-${String(m).padStart(2, "0")}` };
  }
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const startMs = Date.UTC(y, month, 1, 0, 0, 0, 0);
  const endMs = Date.UTC(y, month + 1, 1, 0, 0, 0, 0);
  return { startMs, endMs, yearMonthLabel: `${y}-${String(month + 1).padStart(2, "0")}` };
}

type UserStats = {
  userId: Id<"users">;
  displayName: string;
  school: string | undefined;
  monthlyPoints: number;
  monthlyMinutes: number;
  completedSessions: number;
};

function displayNameFromUser(u: { name?: string; email?: string }): string {
  if (u.name && u.name.trim().length > 0) return u.name.trim();
  const email = u.email?.trim();
  if (email) return email.split("@")[0] ?? "Student";
  return "Student";
}

function compareRows(a: UserStats, b: UserStats): number {
  if (b.monthlyPoints !== a.monthlyPoints) return b.monthlyPoints - a.monthlyPoints;
  if (b.monthlyMinutes !== a.monthlyMinutes) return b.monthlyMinutes - a.monthlyMinutes;
  return b.completedSessions - a.completedSessions;
}

async function buildMonthlyStats(
  ctx: GenericQueryCtx<DataModel>,
  startMs: number,
  endMs: number
): Promise<UserStats[]> {
  const users = await ctx.db.query("users").collect();

  const byUser = new Map<string, UserStats>();
  for (const u of users) {
    byUser.set(u._id, {
      userId: u._id,
      displayName: displayNameFromUser(u),
      school: u.school,
      monthlyPoints: 0,
      monthlyMinutes: 0,
      completedSessions: 0
    });
  }

  const sessionsInMonth = await ctx.db
    .query("study_sessions")
    .withIndex("by_ended_at", (q: any) => q.gte("ended_at", startMs))
    .filter((q: any) =>
      q.and(q.lt(q.field("ended_at"), endMs), q.eq(q.field("status"), "completed"))
    )
    .collect();

  for (const session of sessionsInMonth) {
    const participants = await ctx.db
      .query("session_participants")
      .withIndex("by_session", (q: any) => q.eq("session_id", session._id))
      .collect();

    const dur = session.duration_minutes ?? 0;
    const pts = session.points_awarded ?? 0;

    for (const p of participants) {
      const row = byUser.get(p.user_id);
      if (!row) continue;
      row.monthlyMinutes += dur;
      row.monthlyPoints += pts;
      row.completedSessions += 1;
    }
  }

  return Array.from(byUser.values()).sort(compareRows);
}

function toPublicEntry(rank: number, row: UserStats) {
  return {
    rank,
    userId: row.userId,
    displayName: row.displayName,
    school: row.school,
    monthlyPoints: row.monthlyPoints,
    monthlyMinutes: row.monthlyMinutes,
    completedSessions: row.completedSessions
  };
}

const methodology = {
  timeWindow: "UTC calendar month [startMs, endMs); optional yearMonth YYYY-MM or derive from nowMs",
  source: "Completed study_sessions only (status === completed, ended_at in window).",
  monthlyPoints: "Sum of points_awarded for each such session the user participated in.",
  monthlyMinutes: "Sum of duration_minutes for those sessions.",
  completedSessions: "Count of those sessions.",
  ranking: "monthlyPoints desc, then monthlyMinutes desc, then completedSessions desc.",
  notUsed: "users.points is not used for monthly ranking."
} as const;

export const getMonthlyLeaderboard = queryGeneric({
  args: {
    nowMs: v.optional(v.number()),
    yearMonth: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = args.nowMs ?? Date.now();
    const { startMs, endMs, yearMonthLabel } = monthBoundsUtc(t, args.yearMonth);
    const cap = Math.min(Math.max(1, args.limit ?? 100), 500);

    const sorted = await buildMonthlyStats(ctx, startMs, endMs);
    const entries = sorted.slice(0, cap).map((row, i) => toPublicEntry(i + 1, row));

    return {
      yearMonth: yearMonthLabel,
      period: { startMs, endMs },
      methodology,
      totalRankedUsers: sorted.length,
      limit: cap,
      entries
    };
  }
});

export const getLeaderboardPreview = queryGeneric({
  args: {
    nowMs: v.optional(v.number()),
    yearMonth: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const t = args.nowMs ?? Date.now();
    const previewLimit = Math.min(Math.max(1, args.limit ?? 10), 50);
    const { startMs, endMs, yearMonthLabel } = monthBoundsUtc(t, args.yearMonth);

    const sorted = await buildMonthlyStats(ctx, startMs, endMs);
    const entries = sorted.slice(0, previewLimit).map((row, i) => toPublicEntry(i + 1, row));

    return {
      yearMonth: yearMonthLabel,
      period: { startMs, endMs },
      methodology,
      entries
    };
  }
});

export const getUserRank = queryGeneric({
  args: {
    userId: v.id("users"),
    nowMs: v.optional(v.number()),
    yearMonth: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const t = args.nowMs ?? Date.now();
    const { startMs, endMs, yearMonthLabel } = monthBoundsUtc(t, args.yearMonth);

    const sorted = await buildMonthlyStats(ctx, startMs, endMs);
    const idx = sorted.findIndex((r) => r.userId === args.userId);
    const user = await ctx.db.get(args.userId);

    if (!user) {
      return {
        yearMonth: yearMonthLabel,
        period: { startMs, endMs },
        methodology,
        found: false as const
      };
    }

    const row = sorted[idx];
    if (!row) {
      return {
        yearMonth: yearMonthLabel,
        period: { startMs, endMs },
        methodology,
        found: false as const
      };
    }

    return {
      yearMonth: yearMonthLabel,
      period: { startMs, endMs },
      methodology,
      found: true as const,
      rank: idx + 1,
      totalRankedUsers: sorted.length,
      stats: {
        displayName: row.displayName,
        school: row.school,
        monthlyPoints: row.monthlyPoints,
        monthlyMinutes: row.monthlyMinutes,
        completedSessions: row.completedSessions
      }
    };
  }
});
