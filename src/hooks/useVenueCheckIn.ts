import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { useMutation } from "convex/react";
import { api } from "@/lib/convexApi";

export type VenueCheckInErrorCode =
  | "location_permission_denied"
  | "location_unavailable"
  | "not_authenticated"
  | "invalid_coordinates"
  | "invalid_qr"
  | "spot_not_found"
  | "cafe_not_found"
  | "location_not_found"
  | "invalid_id"
  | "location_too_far"
  | "no_reservation"
  | "no_tables_available"
  | "already_checked_in"
  | "unknown";

export function mapVenueCheckInError(message: string): { code: VenueCheckInErrorCode; userMessage: string } {
  const m = message.toLowerCase();
  if (m.includes("location_permission_denied") || m.includes("permission")) {
    return {
      code: "location_permission_denied",
      userMessage: "Location permission is required to verify you're at the venue."
    };
  }
  if (m.includes("location_unavailable")) {
    return {
      code: "location_unavailable",
      userMessage: "Could not read your GPS position. Try again outdoors or in Settings enable Location."
    };
  }
  if (m.includes("not_authenticated")) {
    return { code: "not_authenticated", userMessage: "Sign in again to check in." };
  }
  if (m.includes("already_checked_in")) {
    const name = message.split("|")[1]?.trim() || "this location";
    return {
      code: "already_checked_in",
      userMessage: `You've already checked in at ${name}. You can lock in and out as needed from the Lock-In tab.`
    };
  }
  if (m.includes("no_tables_available")) {
    return {
      code: "no_tables_available",
      userMessage: "No tables available at this café right now. Try again later."
    };
  }
  if (m.includes("no_reservation")) {
    return {
      code: "no_reservation",
      userMessage: "You don't have a reservation. Pick a duration (up to 4 hours) to walk in, or make a reservation first."
    };
  }
  if (m.includes("location_too_far")) {
    return {
      code: "location_too_far",
      userMessage: "You don't appear to be close enough to this venue. Move closer and try again."
    };
  }
  if (
    m.includes("invalid_id") ||
    m.includes("invalid id") ||
    m.includes("unable to decode id")
  ) {
    return {
      code: "invalid_id",
      userMessage:
        "This QR code doesn’t contain a valid venue ID. Scan the official Study2Gather code for this location."
    };
  }
  if (
    m.includes("spot_not_found") ||
    m.includes("cafe_not_found") ||
    m.includes("location_not_found")
  ) {
    return {
      code: "spot_not_found",
      userMessage: "This QR code isn't linked to a valid café or study spot in our system."
    };
  }
  if (m.includes("invalid_coordinates")) {
    return { code: "invalid_coordinates", userMessage: "Invalid GPS reading. Try again." };
  }
  if (m.includes("invalid_qr_empty") || m.includes("invalid_qr")) {
    return { code: "invalid_qr", userMessage: "Enter or scan a valid venue QR payload." };
  }
  if (
    m.includes("empty_qr") ||
    m.includes("unknown_prefix") ||
    m.includes("invalid_format") ||
    m.includes("invalid_json") ||
    m.includes("json_parse")
  ) {
    return { code: "invalid_qr", userMessage: "That QR code isn't recognized. Scan the venue Study2Gather code." };
  }
  return { code: "unknown", userMessage: message };
}

/**
 * Requests foreground location on **every** call, then calls Convex `completeLocationCheckIn`.
 * (iOS/Android may not show the system sheet again if permission is already granted.)
 */
export function useVenueCheckIn() {
  const complete = useMutation(api.locationCheckIn.completeLocationCheckIn);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const runCheckIn = useCallback(
    async (rawQr: string, durationMinutes?: number) => {
      const trimmed = rawQr.trim();
      if (!trimmed) {
        throw new Error("invalid_qr_empty");
      }

      setIsCheckingIn(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) {
          throw new Error("location_permission_denied");
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        const { latitude, longitude } = pos.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          throw new Error("location_unavailable");
        }

        await complete({
          raw: trimmed,
          latitude,
          longitude,
          nowMs: Date.now(),
          ...(durationMinutes !== undefined ? { durationMinutes } : {})
        });
      } finally {
        setIsCheckingIn(false);
      }
    },
    [complete]
  );

  return { runCheckIn, isCheckingIn };
}
