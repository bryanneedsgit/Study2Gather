/** Lock-in & rewards rule constants (single source of truth for mutations). */

/** Points earned per full second of *eligible raw time* (see `pointsFromEligibleMs`). */
export const POINTS_PER_ELIGIBLE_SECOND = 10000;

export const MAX_SESSION_MINUTES = 240;
export const COOLDOWN_AFTER_CAP_MS = 2 * 60 * 60 * 1000;
/** Local hours [0, 6) earn no points */
export const NIGHT_START_HOUR = 0;
export const NIGHT_END_HOUR = 6;

/** Footfall at or below this → reduce_margin on coupon flow */
export const FOOTFALL_LOW_THRESHOLD = 20;

export const TUTOR_REWARD_POINTS = 50;

export function localHourFromUtcMs(utcMs: number, timezoneOffsetMinutes: number): number {
  const totalMinutes = Math.floor(utcMs / 60000) + timezoneOffsetMinutes;
  const minutesOfDay = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return Math.floor(minutesOfDay / 60);
}

export function isInNoPointsNightWindowLocalHour(hour: number): boolean {
  return hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
}

/**
 * Milliseconds of session wall time that count for points, using **raw elapsed time** (stopwatch-style),
 * excluding any slice that falls in local night 00:00–06:00.
 *
 * Session is capped at MAX_SESSION_MINUTES. Overlap is computed per UTC minute bucket; each bucket uses
 * the local hour at bucket start for the night check (same spirit as the old minute-counter).
 */
export function eligibleMsExcludingNightWindow(
  startMs: number,
  endMs: number,
  timezoneOffsetMinutes: number
): number {
  const cappedEnd = Math.min(endMs, startMs + MAX_SESSION_MINUTES * 60 * 1000);
  if (cappedEnd <= startMs) return 0;

  const startMin = Math.floor(startMs / 60000);
  const endMin = Math.floor(cappedEnd / 60000);
  let eligibleMs = 0;

  for (let m = startMin; m <= endMin; m++) {
    const bucketStart = m * 60000;
    const bucketEnd = (m + 1) * 60000;
    const overlapStart = Math.max(startMs, bucketStart);
    const overlapEnd = Math.min(cappedEnd, bucketEnd);
    if (overlapStart >= overlapEnd) continue;

    const hour = localHourFromUtcMs(bucketStart, timezoneOffsetMinutes);
    if (!isInNoPointsNightWindowLocalHour(hour)) {
      eligibleMs += overlapEnd - overlapStart;
    }
  }

  return eligibleMs;
}

/** `POINTS_PER_ELIGIBLE_SECOND` points per full second of eligible raw time (floor). */
export function pointsFromEligibleMs(eligibleMs: number): number {
  return Math.floor(eligibleMs / 1000) * POINTS_PER_ELIGIBLE_SECOND;
}
