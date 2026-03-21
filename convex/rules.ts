/** Lock-in & rewards rule constants (single source of truth for mutations). */

export const POINTS_PER_60_MIN = 10;
export const MAX_SESSION_MINUTES = 240;
export const COOLDOWN_AFTER_CAP_MS = 2 * 60 * 60 * 1000;
export const INTERVAL_MS = 60 * 60 * 1000;
/** Local hours [0, 6) earn no points */
export const NIGHT_START_HOUR = 0;
export const NIGHT_END_HOUR = 6;

/** Footfall at or below this → reduce_margin on coupon flow */
export const FOOTFALL_LOW_THRESHOLD = 20;

export const TUTOR_REWARD_POINTS = 50;

/** When true, platform may apply a reduced margin on coupons (paired with `cafe_locations.reduce_margin`). */
export function computeReduceMarginFromFootfall(footfallMetric: number): boolean {
  return footfallMetric <= FOOTFALL_LOW_THRESHOLD;
}

export function localHourFromUtcMs(utcMs: number, timezoneOffsetMinutes: number): number {
  const totalMinutes = Math.floor(utcMs / 60000) + timezoneOffsetMinutes;
  const minutesOfDay = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return Math.floor(minutesOfDay / 60);
}

export function isInNoPointsNightWindowLocalHour(hour: number): boolean {
  return hour >= NIGHT_START_HOUR && hour < NIGHT_END_HOUR;
}

/**
 * Count session minutes that fall outside 00:00–06:00 local, capped at MAX_SESSION_MINUTES.
 */
export function eligibleMinutesExcludingNightWindow(
  startMs: number,
  endMs: number,
  timezoneOffsetMinutes: number
): number {
  const cappedEnd = Math.min(endMs, startMs + MAX_SESSION_MINUTES * 60 * 1000);
  const startMin = Math.floor(startMs / 60000);
  const endMin = Math.floor(cappedEnd / 60000);
  let eligible = 0;
  for (let m = startMin; m < endMin; m++) {
    const hour = localHourFromUtcMs(m * 60000, timezoneOffsetMinutes);
    if (!isInNoPointsNightWindowLocalHour(hour)) eligible++;
  }
  return eligible;
}

export function fullIntervalsFromMinutes(eligibleMinutes: number): number {
  return Math.floor(eligibleMinutes / 60);
}

export function pointsForIntervals(intervals: number): number {
  return intervals * POINTS_PER_60_MIN;
}
