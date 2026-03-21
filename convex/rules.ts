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

/** How far ahead a reservation may start (ms from `nowMs` passed by the client). */
export const RESERVATION_MAX_ADVANCE_MS = 7 * 24 * 60 * 60 * 1000;

export const RESERVATION_MS_PER_HOUR = 60 * 60 * 1000;
export const RESERVATION_MS_PER_DAY = 24 * RESERVATION_MS_PER_HOUR;

/**
 * **Flat** advance reservation fee (€), not prorated by stay length — from lead time `startMs - bookingNowMs`:
 * - \> 3 days → €3
 * - \> 2 days and ≤ 3 days → €4
 * - otherwise (incl. negative lead) → €5
 */
export function reservationAdvanceFlatEuro(bookingNowMs: number, startMs: number): number {
  const advanceMs = startMs - bookingNowMs;
  if (!Number.isFinite(advanceMs) || !Number.isFinite(bookingNowMs) || !Number.isFinite(startMs)) {
    throw new Error("invalid_time_range");
  }
  if (advanceMs < 0) return 5;
  if (advanceMs > 3 * RESERVATION_MS_PER_DAY) return 3;
  if (advanceMs > 2 * RESERVATION_MS_PER_DAY) return 4;
  return 5;
}

/** @deprecated Use {@link reservationAdvanceFlatEuro}. Kept for any legacy imports. */
export const reservationFirstHourBaseEuro = reservationAdvanceFlatEuro;

/**
 * Single €/h rate for the **whole** stay from **total** booked hours `H`:
 * - **H ≤ 1** → €3/h
 * - **1 < H ≤ 3** → €2.50/h (2–3h bookings)
 * - **3 < H ≤ 4** → €2.50/h (gap between “2–3h” and “over 4h” long tier)
 * - **H > 4** → €1.50/h
 */
export function stayEuroPerHourForTotalDurationHours(H: number): number {
  if (H <= 1) return 3;
  if (H <= 3) return 2.5;
  if (H <= 4) return 2.5;
  return 1.5;
}

/**
 * Total price = **flat advance fee** + **stay** (one hourly rate for entire duration from bracket above).
 *
 * Extensions: pass the **original** `bookingNowMs` so the full [start, end) reprices as if booked then.
 */
export type ReservationPriceBreakdownLine = {
  tier: "advance" | "stay";
  label: string;
  hours: number;
  rateEuroPerHour: number;
  subtotalEuro: number;
};

export function computeTieredReservationPriceEuros(
  startMs: number,
  endMs: number,
  bookingNowMs: number
): {
  durationHours: number;
  costEuro: number;
  /** Same as advance flat € (3/4/5). Name kept for API compatibility with clients. */
  firstHourBaseEuro: number;
  /** Flat advance reservation fee (€3 / €4 / €5). */
  reservationEuro: number;
  /** Stay only: `H × rate(H)` where rate depends on total hours (see `stayEuroPerHourForTotalDurationHours`). */
  hourlyTierEuro: number;
  breakdown: ReservationPriceBreakdownLine[];
} {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("invalid_time_range");
  }
  const H = (endMs - startMs) / RESERVATION_MS_PER_HOUR;
  const flat = reservationAdvanceFlatEuro(bookingNowMs, startMs);

  const stayRate = stayEuroPerHourForTotalDurationHours(H);
  const rawHourly = H * stayRate;
  const costEuro = Math.round((flat + rawHourly) * 100) / 100;

  let reservationEuro = Math.round(flat * 100) / 100;
  let hourlyTierEuro = Math.round(rawHourly * 100) / 100;
  const sumParts = Math.round((reservationEuro + hourlyTierEuro) * 100) / 100;
  if (sumParts !== costEuro) {
    hourlyTierEuro = Math.round((costEuro - reservationEuro) * 100) / 100;
  }

  const breakdown: ReservationPriceBreakdownLine[] = [];
  breakdown.push({
    tier: "advance",
    label: "Advance reservation fee (fixed)",
    hours: 1,
    rateEuroPerHour: flat,
    subtotalEuro: reservationEuro
  });

  const stayLabel =
    H <= 1
      ? "Stay (up to 1h total @ €3/h)"
      : H <= 3
        ? "Stay (over 1h up to 3h @ €2.50/h)"
        : H <= 4
          ? "Stay (over 3h up to 4h @ €2.50/h)"
          : "Stay (over 4h @ €1.50/h)";

  breakdown.push({
    tier: "stay",
    label: stayLabel,
    hours: H,
    rateEuroPerHour: stayRate,
    subtotalEuro: hourlyTierEuro
  });

  return {
    durationHours: H,
    costEuro,
    firstHourBaseEuro: flat,
    reservationEuro,
    hourlyTierEuro,
    breakdown
  };
}

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
