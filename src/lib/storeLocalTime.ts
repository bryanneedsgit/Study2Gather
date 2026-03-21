/**
 * Store-local calendar math (must match `convex/cafeHours.ts`).
 * `timezoneOffsetMinutes` = minutes east of UTC (Singapore +480, CET +60).
 */

export const RESERVATION_MAX_ADVANCE_MS = 7 * 24 * 60 * 60 * 1000;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const SLOT_STEP_MINUTES = 30;

export function storeLocalDayStartUtcMs(utcMs: number, timezoneOffsetMinutes: number): number {
  const totalMinutes = Math.floor(utcMs / 60000) + timezoneOffsetMinutes;
  const dayStartLocalMinutes = Math.floor(totalMinutes / (24 * 60)) * (24 * 60);
  return (dayStartLocalMinutes - timezoneOffsetMinutes) * 60000;
}

/**
 * UTC instant of store-local **midnight** for the calendar day that is `dayOffset` whole days after the
 * store-local day containing `anchorUtcMs`. Uses repeated +25h jumps so DST / non-24h UTC gaps don’t shift
 * the wrong calendar day (unlike `+ dayOffset * 86400000`).
 */
export function storeLocalDayStartWithDayOffset(
  anchorUtcMs: number,
  timezoneOffsetMinutes: number,
  dayOffset: number
): number {
  if (dayOffset <= 0) {
    return storeLocalDayStartUtcMs(anchorUtcMs, timezoneOffsetMinutes);
  }
  let t = storeLocalDayStartUtcMs(anchorUtcMs, timezoneOffsetMinutes);
  for (let i = 0; i < dayOffset; i++) {
    t = storeLocalDayStartUtcMs(t + 25 * 60 * 60 * 1000, timezoneOffsetMinutes);
  }
  return t;
}

export function localMinutesSinceMidnightUtc(
  utcMs: number,
  timezoneOffsetMinutes: number
): number {
  const totalMinutes = Math.floor(utcMs / 60000) + timezoneOffsetMinutes;
  return ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
}

export function formatStoreLocalTime(utcMs: number, timezoneOffsetMinutes: number): string {
  const m = localMinutesSinceMidnightUtc(utcMs, timezoneOffsetMinutes);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

export function formatStoreLocalDateShort(
  utcMs: number,
  timezoneOffsetMinutes: number
): string {
  const pseudo = utcMs + timezoneOffsetMinutes * 60000;
  return new Date(pseudo).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

/** Date + time in store-local wall clock (same offset model as {@link formatStoreLocalTime}). */
export function formatStoreLocalDateTime(
  utcMs: number,
  timezoneOffsetMinutes: number
): string {
  const pseudo = utcMs + timezoneOffsetMinutes * 60000;
  return new Date(pseudo).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  });
}

export function formatMinuteOfDayAsClock(minuteOfDay: number): string {
  const h = Math.floor(minuteOfDay / 60);
  const m = minuteOfDay % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
