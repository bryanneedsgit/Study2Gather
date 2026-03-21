import {
  ActivityIndicator,
  Alert,
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

export function LockInScreen() {
  const { user } = useSession();
  const { isLockedIn, startLockIn } = useLockInSession();
  const policy = useQuery(api.lockInSolo.getLockInPointsPolicy, {});
  const locationCheckIn = useQuery(api.locationCheckIn.getActiveLocationCheckIn, user?._id ? {} : "skip");

  const canStart = Boolean(
    user?._id && user && !isLockedIn && locationCheckIn !== undefined && locationCheckIn !== null
  );

  async function onStart() {
    try {
      await startLockIn();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert("Could not start", message);
    }
  }

  const loadingPolicy = policy === undefined || locationCheckIn === undefined;

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
              title={isLockedIn ? "Session active (see fullscreen)" : "Start locked in"}
              onPress={() => void onStart()}
              disabled={!canStart}
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
