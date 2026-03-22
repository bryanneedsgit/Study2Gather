import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/lib/convexApi";
import {
  formatMinuteOfDayAsClock,
  formatStoreLocalDateShort,
  formatStoreLocalTime,
  MS_PER_DAY,
  RESERVATION_MAX_ADVANCE_MS,
  SLOT_STEP_MINUTES,
  storeLocalDayStartWithDayOffset
} from "@/lib/storeLocalTime";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/stripeConfig";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";
import type { Id } from "../../../convex/_generated/dataModel";

const MS_PER_HOUR = 60 * 60 * 1000;

export type CafeReservationModalCafe = {
  name: string;
  cafeId: Id<"cafe_locations">;
  timezone_offset_minutes: number;
  opens_local_minute: number;
  closes_local_minute: number;
};

export type CafeReservationPaymentPayload = {
  amountCents: number;
  cafeName: string;
  cafeId: Id<"cafe_locations">;
  userId: Id<"users">;
  startTime: number;
  endTime: number;
  bookingNowMs: number;
  storeTimezoneOffsetMinutes: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  cafe: CafeReservationModalCafe | null;
  userId: Id<"users"> | undefined;
  /** For “today” / max-advance day list. */
  nowMs: number;
  /** Frozen when modal opens — same instant used for quote + `pricing_booking_now_ms`. */
  bookingNowMs: number;
  /**
   * When set and `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set, totals ≥ €0.50 use **Pay & reserve**
   * (opens `Payment` on the root stack) instead of charging nothing here.
   */
  onOpenPaymentFlow?: (payload: CafeReservationPaymentPayload) => void;
  onReserve: (args: {
    cafeId: Id<"cafe_locations">;
    userId: Id<"users">;
    startTime: number;
    endTime: number;
    nowMs: number;
    bookingNowMs: number;
    /** For success UI: format end time in store-local clock, not device TZ. */
    storeTimezoneOffsetMinutes: number;
  }) => Promise<boolean>;
};

function selectableDayOffsets(nowMs: number, tz: number): number[] {
  const out: number[] = [];
  const maxD = Math.ceil(RESERVATION_MAX_ADVANCE_MS / MS_PER_DAY) + 2;
  for (let d = 0; d <= maxD; d++) {
    const dayStart = storeLocalDayStartWithDayOffset(nowMs, tz, d);
    const nextDayStart = storeLocalDayStartWithDayOffset(nowMs, tz, d + 1);
    if (nextDayStart <= nowMs) continue;
    if (dayStart > nowMs + RESERVATION_MAX_ADVANCE_MS) continue;
    out.push(d);
  }
  return out;
}

function startSlotsForDay(
  dayOffset: number,
  nowMs: number,
  tz: number,
  openMin: number,
  closeMin: number
): number[] {
  const dayStart = storeLocalDayStartWithDayOffset(nowMs, tz, dayOffset);
  const closeUtc = dayStart + closeMin * 60000;
  const slots: number[] = [];
  for (let m = openMin; m < closeMin; m += SLOT_STEP_MINUTES) {
    const utc = dayStart + m * 60000;
    if (utc < nowMs) continue;
    if (utc > nowMs + RESERVATION_MAX_ADVANCE_MS) continue;
    if (utc + SLOT_STEP_MINUTES * 60000 > closeUtc) continue;
    slots.push(m);
  }
  return slots;
}

/** End times on the same store-local day, aligned to `SLOT_STEP_MINUTES`, strictly after `startUtc`. */
function endUtcSlotsForStart(startUtc: number, closeUtc: number): number[] {
  const out: number[] = [];
  const stepMs = SLOT_STEP_MINUTES * 60000;
  for (let t = startUtc + stepMs; t <= closeUtc; t += stepMs) {
    if (t > startUtc) out.push(t);
  }
  return out;
}

export function CafeReservationModal({
  visible,
  onClose,
  cafe,
  userId,
  nowMs,
  bookingNowMs,
  onOpenPaymentFlow,
  onReserve
}: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [dayOffset, setDayOffset] = useState(0);
  const [startLocalMinute, setStartLocalMinute] = useState<number | null>(null);
  const [endUtc, setEndUtc] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const tz = cafe?.timezone_offset_minutes ?? 0;
  const openMin = cafe?.opens_local_minute ?? 8 * 60;
  const closeMin = cafe?.closes_local_minute ?? 22 * 60;
  /** Same rule as `isReservationWithinStoreOpeningHours`: no overnight / closed window. */
  const cafeOpenForReservations = openMin < closeMin;

  const days = useMemo(() => selectableDayOffsets(nowMs, tz), [nowMs, tz]);

  const startSlots = useMemo(
    () => startSlotsForDay(dayOffset, nowMs, tz, openMin, closeMin),
    [dayOffset, nowMs, tz, openMin, closeMin]
  );

  /** No end times until this day has at least one bookable start slot. */
  const showEndTimeSection = cafeOpenForReservations && startSlots.length > 0;

  /** Ignore stale `startLocalMinute` when the day has no slots or the minute is not in the list. */
  const resolvedStartLocalMinute = useMemo(() => {
    if (startSlots.length === 0) return null;
    if (startLocalMinute !== null && startSlots.includes(startLocalMinute)) return startLocalMinute;
    return startSlots[0]!;
  }, [startLocalMinute, startSlots]);

  const startUtc = useMemo(() => {
    if (resolvedStartLocalMinute === null || !cafe) return 0;
    const dayStart = storeLocalDayStartWithDayOffset(nowMs, tz, dayOffset);
    return dayStart + resolvedStartLocalMinute * 60000;
  }, [cafe, dayOffset, nowMs, resolvedStartLocalMinute, tz]);

  const closeUtcForDay = useMemo(() => {
    const dayStart = storeLocalDayStartWithDayOffset(nowMs, tz, dayOffset);
    return dayStart + closeMin * 60000;
  }, [closeMin, dayOffset, nowMs, tz]);

  const endSlots = useMemo(
    () => (startUtc > 0 ? endUtcSlotsForStart(startUtc, closeUtcForDay) : []),
    [closeUtcForDay, startUtc]
  );

  const totalHours =
    startUtc > 0 && endUtc > startUtc ? (endUtc - startUtc) / MS_PER_HOUR : 0;

  const quoteArgs =
    cafe && startUtc > 0 && endUtc > startUtc
      ? { startTime: startUtc, endTime: endUtc, bookingNowMs }
      : "skip";
  const quote = useQuery(api.cafe.quoteTimeBasedReservation, quoteArgs);

  const resetSelection = useCallback(() => {
    if (!cafe) return;
    const dList = selectableDayOffsets(nowMs, cafe.timezone_offset_minutes);
    for (const d of dList) {
      const slots = startSlotsForDay(
        d,
        nowMs,
        cafe.timezone_offset_minutes,
        cafe.opens_local_minute,
        cafe.closes_local_minute
      );
      if (slots.length > 0) {
        setDayOffset(d);
        setStartLocalMinute(slots[0]!);
        const dayStart = storeLocalDayStartWithDayOffset(nowMs, cafe.timezone_offset_minutes, d);
        const cUtc = dayStart + cafe.closes_local_minute * 60000;
        const firstStart = dayStart + slots[0]! * 60000;
        const ends = endUtcSlotsForStart(firstStart, cUtc);
        setEndUtc(ends[0] ?? 0);
        return;
      }
    }
    setDayOffset(dList[0] ?? 0);
    setStartLocalMinute(null);
    setEndUtc(0);
  }, [cafe, nowMs]);

  useEffect(() => {
    if (visible && cafe) {
      resetSelection();
    }
  }, [visible, cafe?.cafeId, nowMs, resetSelection, cafe]);

  useEffect(() => {
    if (startUtc <= 0) {
      setEndUtc(0);
      return;
    }
    const ends = endUtcSlotsForStart(startUtc, closeUtcForDay);
    if (ends.length === 0) {
      setEndUtc(0);
      return;
    }
    if (endUtc <= startUtc || !ends.includes(endUtc)) {
      setEndUtc(ends[0]!);
    }
  }, [closeUtcForDay, endUtc, startUtc]);

  const amountCents = quote ? Math.round(quote.costEuro * 100) : 0;
  const usePaymentFirst =
    Boolean(STRIPE_PUBLISHABLE_KEY && onOpenPaymentFlow && quote && amountCents >= 50);

  const onConfirm = async () => {
    if (!cafe || !userId || startUtc <= 0 || endUtc <= startUtc) return;

    if (usePaymentFirst && onOpenPaymentFlow && quote) {
      onOpenPaymentFlow({
        amountCents,
        cafeName: cafe.name,
        cafeId: cafe.cafeId,
        userId,
        startTime: startUtc,
        endTime: endUtc,
        bookingNowMs,
        storeTimezoneOffsetMinutes: tz
      });
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onReserve({
        cafeId: cafe.cafeId,
        userId,
        startTime: startUtc,
        endTime: endUtc,
        nowMs: Date.now(),
        bookingNowMs,
        storeTimezoneOffsetMinutes: tz
      });
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!cafe) return null;

  const openClock = formatMinuteOfDayAsClock(openMin);
  const closeClock = formatMinuteOfDayAsClock(closeMin);

  /** Cap sheet height so we can give the scroll region a hard max — avoids pricing crushing chip rows. */
  const sheetMaxHeight = Math.round(windowHeight * 0.88);
  const footerReserve = 100;
  const bodyScrollMaxHeight = Math.max(220, sheetMaxHeight - footerReserve);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close modal backdrop">
        <Pressable
          style={[styles.sheet, { maxHeight: sheetMaxHeight }]}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            style={[styles.sheetBodyScroll, { maxHeight: bodyScrollMaxHeight }]}
            contentContainerStyle={styles.sheetBodyScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            bounces
          >
            <View style={styles.timingBlock}>
              <Text style={styles.title}>Reserve · {cafe.name}</Text>
              <Text style={styles.hoursLine}>
                {cafeOpenForReservations
                  ? `Open ${openClock}–${closeClock} (store local time)`
                  : "Closed — reservations unavailable (invalid or zero opening window)."}
              </Text>
          <Text style={styles.priceLine}>
            Fixed reservation fee by lead time (€3 / €4 / €5). Stay uses one rate for the whole booking: €3/h if
            ≤1h, €2.50/h if over 1h up to 4h, €1.50/h if over 4h. Extensions reprice the full slot from your
            original booking time.
          </Text>

              <Text style={styles.sectionLabel}>Day</Text>
              {days.length === 0 ? (
                <Text style={styles.muted}>No bookable days (check max advance or opening hours).</Text>
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {days.map((d) => {
                  const dayStart = storeLocalDayStartWithDayOffset(nowMs, tz, d);
                  const label =
                    d === 0
                      ? "Today"
                      : d === 1
                        ? "Tomorrow"
                        : formatStoreLocalDateShort(dayStart, tz);
                  const active = d === dayOffset;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDayOffset(d)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.sectionLabel}>Start time</Text>
              {startSlots.length === 0 ? (
                <Text style={styles.muted}>No slots left this day within opening hours.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                  {startSlots.map((m) => {
                    const dayStart = storeLocalDayStartWithDayOffset(nowMs, tz, dayOffset);
                    const utc = dayStart + m * 60000;
                    const active = m === resolvedStartLocalMinute;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setStartLocalMinute(m)}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {formatStoreLocalTime(utc, tz)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {showEndTimeSection ? (
                <>
                  <Text style={styles.sectionLabel}>End time</Text>
                  {endSlots.length === 0 ? (
                    <Text style={styles.muted}>
                      No time left before closing after this start — pick an earlier start.
                    </Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                      {endSlots.map((t) => {
                        const valid = t > startUtc;
                        const active = t === endUtc;
                        return (
                          <Pressable
                            key={t}
                            disabled={!valid}
                            onPress={() => {
                              if (t > startUtc) setEndUtc(t);
                            }}
                            style={[
                              styles.chip,
                              active && styles.chipActive,
                              !valid && styles.chipDisabled
                            ]}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {formatStoreLocalTime(t, tz)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  )}
                </>
              ) : !cafeOpenForReservations ? (
                <Text style={[styles.muted, { marginTop: space.sm }]}>
                  This café has no reservable hours (closed or invalid opening window).
                </Text>
              ) : null}
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Your slot (store time)</Text>
              {startUtc > 0 && endUtc > startUtc ? (
                <Text style={styles.summaryValue}>
                  {formatStoreLocalDateShort(startUtc, tz)} · {formatStoreLocalTime(startUtc, tz)} –{" "}
                  {formatStoreLocalTime(endUtc, tz)}
                </Text>
              ) : (
                <Text style={styles.muted}>—</Text>
              )}
              <Text style={styles.summaryLabel}>Total time</Text>
              {totalHours > 0 ? (
                <Text style={styles.totalHoursValue}>{totalHours.toFixed(2)} hours</Text>
              ) : (
                <Text style={styles.muted}>—</Text>
              )}
              <Text style={styles.summaryLabel}>Price (2 tiers)</Text>
              {quoteArgs !== "skip" && quote === undefined ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
              ) : quote ? (
                <View style={styles.breakdownBox}>
                  <View style={styles.tierBlock}>
                    <View style={styles.tierHeaderRow}>
                      <Text style={styles.tierTitle}>Reservation price</Text>
                      <Text style={styles.tierAmount}>€{quote.reservationEuro.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.tierHint}>
                      One-time fee: &gt;3 days €3 · 2–3 days €4 · &lt;2 days €5 (not prorated with stay length).
                    </Text>
                    {quote.breakdown
                      ?.filter((l) => l.tier === "advance")
                      .map((line, i) => (
                        <View key={`res-${i}`} style={styles.breakdownRow}>
                          <Text style={styles.breakdownMath}>Fixed fee (this booking)</Text>
                          <Text style={styles.breakdownSubtotal}>€{line.subtotalEuro.toFixed(2)}</Text>
                        </View>
                      ))}
                  </View>

                  <View style={styles.tierBlock}>
                    <View style={styles.tierHeaderRow}>
                      <Text style={styles.tierTitle}>Hourly rate</Text>
                      <Text style={styles.tierAmount}>€{quote.hourlyTierEuro.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.tierHint}>
                      One rate for entire length: ≤1h €3/h · 1–4h €2.50/h · &gt;4h €1.50/h.
                    </Text>
                    {quote.breakdown
                      ?.filter((l) => l.tier === "stay")
                      .map((line, i) => (
                        <View key={`hr-${i}`} style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel} numberOfLines={3}>
                            {line.label}
                          </Text>
                          <Text style={styles.breakdownMath}>
                            {line.hours.toFixed(2)} h × €{line.rateEuroPerHour.toFixed(2)}/h
                          </Text>
                          <Text style={styles.breakdownSubtotal}>€{line.subtotalEuro.toFixed(2)}</Text>
                        </View>
                      ))}
                  </View>

                  <View style={styles.breakdownTotalRow}>
                    <Text style={styles.breakdownTotalLabel}>Total</Text>
                    <Text style={styles.breakdownTotalAmount}>€{quote.costEuro.toFixed(2)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.muted}>—</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.btnSecondary} accessibilityRole="button">
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void onConfirm()}
              disabled={
                submitting ||
                !userId ||
                !cafeOpenForReservations ||
                !showEndTimeSection ||
                startSlots.length === 0 ||
                endSlots.length === 0 ||
                startUtc <= 0 ||
                endUtc <= startUtc ||
                (usePaymentFirst && quote === undefined)
              }
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.btnPrimaryPressed,
                (submitting ||
                  !userId ||
                  !cafeOpenForReservations ||
                  !showEndTimeSection ||
                  startSlots.length === 0 ||
                  endSlots.length === 0 ||
                  startUtc <= 0 ||
                  endUtc <= startUtc ||
                  (usePaymentFirst && quote === undefined)) &&
                  styles.btnDisabled
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.btnPrimaryText}>
                {submitting
                  ? "Saving…"
                  : userId
                    ? usePaymentFirst
                      ? "Pay & reserve"
                      : "Confirm"
                    : "Sign in to reserve"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end"
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    width: "100%",
    overflow: "hidden"
  },
  /** Hard-capped height (set in component) so pricing cannot shrink chip rows — scroll inside instead. */
  sheetBodyScroll: {
    flexGrow: 0
  },
  sheetBodyScrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.sm
  },
  timingBlock: {
    flexShrink: 0
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: space.xs
  },
  hoursLine: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4
  },
  priceLine: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: space.md,
    lineHeight: 18
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: space.xs,
    marginTop: space.sm
  },
  chipsRow: {
    flexGrow: 0,
    marginBottom: space.xs
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  chipTextActive: {
    color: colors.primary
  },
  chipDisabled: {
    opacity: 0.35
  },
  muted: {
    fontSize: 14,
    color: colors.textMuted
  },
  summary: {
    marginTop: space.sm,
    padding: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: space.xs
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 4
  },
  totalHoursValue: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 4
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 4
  },
  breakdownBox: {
    marginTop: 4,
    gap: 10
  },
  tierBlock: {
    marginBottom: 4
  },
  tierHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary
  },
  tierAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary
  },
  tierHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 15
  },
  breakdownRow: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2
  },
  breakdownMath: {
    fontSize: 12,
    color: colors.textMuted
  },
  breakdownSubtotal: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2
  },
  breakdownTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  breakdownTotalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary
  },
  breakdownTotalAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: space.md,
    flexShrink: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundElevated
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  btnSecondaryText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600"
  },
  btnPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    backgroundColor: colors.primary
  },
  btnPrimaryPressed: {
    opacity: 0.9
  },
  btnDisabled: {
    opacity: 0.45
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0a0f1a"
  }
});
