import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useSession } from "@/context/SessionContext";
import { useLockInSession } from "@/context/LockInSessionContext";
import { api } from "@/lib/convexApi";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

function mapLockInError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("night_window_no_start")) {
    return "Lock-in can't be started between 12:00 AM and 6:00 AM (your local time). Try again during the day.";
  }
  if (m.includes("location_check_in_required")) return "Complete check-in on the Check-in tab first.";
  if (m.includes("already_locked_in")) return "You already have an active session.";
  if (m.includes("cooldown_active")) return "You're in cooldown. Wait before starting another session.";
  return message;
}

export function LockInScreen() {
  const { user } = useSession();
  const { isLockedIn, startLockIn } = useLockInSession();
  const [isStarting, setIsStarting] = useState(false);
  const policy = useQuery(api.lockInSolo.getLockInPointsPolicy, {});
  const locationCheckIn = useQuery(api.locationCheckIn.getActiveLocationCheckIn, user?._id ? {} : "skip");

  const canStart = Boolean(
    user?._id && user && !isLockedIn && locationCheckIn !== undefined && locationCheckIn !== null
  );

  const onStart = useCallback(async () => {
    if (!canStart || isStarting) return;
    setIsStarting(true);
    try {
      await startLockIn();
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const message = mapLockInError(raw);
      console.error("[LockIn] startLockIn failed:", e);
      if (Platform.OS === "web") {
        window.alert(`Could not start: ${message}`);
      } else {
        Alert.alert("Could not start", message);
      }
    } finally {
      setIsStarting(false);
    }
  }, [canStart, isStarting, startLockIn]);

  return (
    <PlaceholderScreen title="Lock-In" subtitle="Solo focus session — earn points for eligible time.">
      {policy === undefined ? (
        <ActivityIndicator />
      ) : (
        <AppCard style={styles.card}>
          <Text style={styles.heading}>How points work</Text>
          <Text style={styles.body}>{policy.description}</Text>
          <Text style={styles.bullet}>
            • {policy.pointsPerEligibleSecond} point per second of eligible focus time
          </Text>
          <Text style={styles.bullet}>• Max session length for points: {policy.maxSessionMinutes} minutes</Text>
          <Text style={styles.bullet}>
            • No points for local night hours {policy.nightWindowLocalHours.start}:00–{policy.nightWindowLocalHours.end}
            :00 (can’t start a session in that window)
          </Text>
          <Text style={styles.bullet}>
            • After hitting the max length, a {policy.cooldownAfterCapHours}h cooldown may apply before the next
            session
          </Text>
        </AppCard>
      )}

      {user?._id && !isLockedIn && locationCheckIn !== undefined ? (
        <View style={styles.checkInCard}>
          <Text style={styles.checkInTitle}>Venue check-in</Text>
          {locationCheckIn === null ? (
            <Text style={styles.muted}>
              Use the <Text style={styles.bold}>Check in</Text> tab: scan the venue QR. We verify the code against our
              database, then request your location and compare it to the venue&apos;s coordinates automatically.
              {"\n\n"}
              If you added a check-in manually, ensure user_id matches your account, status is &quot;active&quot;, and
              expires_at is in the future.
            </Text>
          ) : (
            <Text style={styles.checkedIn}>
              ✓ Checked in{locationCheckIn.locationName ? ` at ${locationCheckIn.locationName}` : ""}. You can start
              locked in below.
            </Text>
          )}
        </View>
      ) : null}

      <View style={styles.actions}>
        {!user?._id ? (
          <Text style={styles.muted}>Sign in to use Lock-In.</Text>
        ) : (
          <>
            <PrimaryButton
              title={isLockedIn ? "Session active" : "Start locked in"}
              onPress={() => void onStart()}
              disabled={!canStart}
              loading={isStarting}
            />
            {!isLockedIn ? (
              <Text style={styles.muted}>
                {locationCheckIn === null
                  ? "Complete check-in on the Check-in tab first (scan QR + location) — then Start locked in unlocks."
                  : "Starts a fullscreen session with a live timer. Tap \"End locked in\" to finish — points are added automatically from eligible duration."}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md
  },
  checkInCard: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10
  },
  checkInTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a"
  },
  checkedIn: {
    fontSize: 14,
    color: "#15803d",
    lineHeight: 20
  },
  bold: {
    fontWeight: "700"
  },
  heading: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: space.sm,
    color: colors.textPrimary
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: space.md
  },
  bullet: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: space.sm,
    lineHeight: 18
  },
  actions: {
    gap: space.md,
    marginTop: space.sm
  },
  muted: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18
  }
});
