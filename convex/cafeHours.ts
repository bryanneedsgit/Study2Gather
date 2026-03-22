/**
 * Store-local opening hours (fixed daily window, same every day).
 * Minutes are **store local** minutes from midnight [0, 1440).
 * `timezone_offset_minutes`: east-of-UTC (e.g. Singapore +480, CET +60).
 */

export const DEFAULT_TIMEZONE_OFFSET_MINUTES = 0;
export const DEFAULT_OPENS_LOCAL_MINUTE = 8 * 60;
export const DEFAULT_CLOSES_LOCAL_MINUTE = 22 * 60;

export function resolveCafeOpeningHours(cafe: {
  timezone_offset_minutes?: number;
  opens_local_minute?: number;
  closes_local_minute?: number;
}): {
  timezoneOffsetMinutes: number;
  opensLocalMinute: number;
  closesLocalMinute: number;
} {
  return {
    timezoneOffsetMinutes: cafe.timezone_offset_minutes ?? DEFAULT_TIMEZONE_OFFSET_MINUTES,
    opensLocalMinute: cafe.opens_local_minute ?? DEFAULT_OPENS_LOCAL_MINUTE,
    closesLocalMinute: cafe.closes_local_minute ?? DEFAULT_CLOSES_LOCAL_MINUTE
  };
}

/** UTC ms at store-local midnight for the store-local calendar day containing `utcMs`. */
export function storeLocalDayStartUtcMs(utcMs: number, timezoneOffsetMinutes: number): number {
  const totalMinutes = Math.floor(utcMs / 60000) + timezoneOffsetMinutes;
  const dayStartLocalMinutes = Math.floor(totalMinutes / (24 * 60)) * (24 * 60);
  return (dayStartLocalMinutes - timezoneOffsetMinutes) * 60000;
}

export function localMinutesSinceMidnightUtc(
  utcMs: number,
  timezoneOffsetMinutes: number
): number {
  const totalMinutes = Math.floor(utcMs / 60000) + timezoneOffsetMinutes;
  return ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
}

/**
 * [startMs, endMs) must lie entirely on one store-local day and within [opens, closes] that day.
 * Overnight hours (close < open) are not supported yet.
 */
export function isReservationWithinStoreOpeningHours(
  startMs: number,
  endMs: number,
  cafe: {
    timezone_offset_minutes?: number;
    opens_local_minute?: number;
    closes_local_minute?: number;
  }
): boolean {
  const { timezoneOffsetMinutes, opensLocalMinute, closesLocalMinute } =
    resolveCafeOpeningHours(cafe);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return false;

  if (opensLocalMinute >= closesLocalMinute) return false;

  const dayStart = storeLocalDayStartUtcMs(startMs, timezoneOffsetMinutes);
  if (storeLocalDayStartUtcMs(endMs - 1, timezoneOffsetMinutes) !== dayStart) {
    return false;
  }

  const openUtc = dayStart + opensLocalMinute * 60000;
  const closeUtc = dayStart + closesLocalMinute * 60000;

  return startMs >= openUtc && endMs <= closeUtc;
}
