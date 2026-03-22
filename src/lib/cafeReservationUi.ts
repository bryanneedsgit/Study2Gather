/**
 * Helpers for cafe reservation / seat-hold mutations (`convex/cafe.ts`).
 * Success payloads come from mutation return values; failures throw `Error` with `.message` equal to one of
 * {@link CAFE_RESERVATION_MUTATION_ERRORS}.
 */

export const CAFE_RESERVATION_MUTATION_ERRORS = [
  "cafe_full",
  "cafe_full_for_slot",
  "cafe_not_found",
  "user_not_found",
  "user_already_has_active_hold",
  "hold_not_found",
  "hold_user_mismatch",
  "hold_not_active",
  "hold_expired",
  "reservation_start_in_past",
  "reservation_too_far_in_advance",
  "reservation_end_not_after_start",
  "reservation_too_short",
  "invalid_time_range",
  "outside_opening_hours",
  "reservation_user_mismatch",
  "reservation_not_extendable",
  "extension_end_not_after_current"
] as const;

export type CafeReservationMutationError = (typeof CAFE_RESERVATION_MUTATION_ERRORS)[number];

function readErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return "";
}

export function isCafeReservationMutationError(
  message: string
): message is CafeReservationMutationError {
  return (CAFE_RESERVATION_MUTATION_ERRORS as readonly string[]).includes(message);
}

/** Returns a known cafe mutation error code, or `null` (network, unknown, etc.). */
export function getCafeReservationMutationError(err: unknown): CafeReservationMutationError | null {
  const msg = readErrorMessage(err);
  return isCafeReservationMutationError(msg) ? msg : null;
}

/** True when the user should see a “café full” style message. */
export function isCafeFullError(err: unknown): boolean {
  const code = getCafeReservationMutationError(err);
  return code === "cafe_full" || code === "cafe_full_for_slot";
}

/** Short message for `Alert` / toasts when a cafe booking mutation fails. */
export function getCafeReservationUserMessage(err: unknown): string {
  const code = getCafeReservationMutationError(err);
  switch (code) {
    case "cafe_full":
      return "No seats available right now. Try again when someone leaves.";
    case "cafe_full_for_slot":
      return "That time slot is fully booked. Try different times or another café.";
    case "cafe_not_found":
      return "This café is no longer available.";
    case "user_not_found":
      return "Your account was not found. Try signing in again.";
    case "user_already_has_active_hold":
      return "You already have an active seat hold. Finish or wait for it to expire.";
    case "hold_not_found":
    case "hold_user_mismatch":
    case "hold_not_active":
      return "That seat hold is no longer valid.";
    case "hold_expired":
      return "Your seat hold expired. Start again.";
    case "reservation_start_in_past":
      return "Start time must be in the future.";
    case "reservation_too_far_in_advance":
      return "You can only book up to 7 days ahead.";
    case "reservation_end_not_after_start":
      return "End time must be after start time.";
    case "reservation_too_short":
      return "Reservation must be at least one minute.";
    case "invalid_time_range":
      return "Invalid start or end time.";
    case "outside_opening_hours":
      return "Choose a time within this café’s opening hours (same calendar day at the store).";
    case "reservation_user_mismatch":
      return "This reservation belongs to another account.";
    case "reservation_not_extendable":
      return "Only active confirmed reservations can be extended.";
    case "extension_end_not_after_current":
      return "Choose an end time after your current booking end.";
    default:
      return readErrorMessage(err) || "Something went wrong. Please try again.";
  }
}
