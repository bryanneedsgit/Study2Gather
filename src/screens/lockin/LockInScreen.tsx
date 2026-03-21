import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useSession } from "@/context/SessionContext";
import { useLockInSession } from "@/context/LockInSessionContext";
import { api } from "@/lib/convexApi";

export function LockInScreen() {
  const { user } = useSession();
  const { isLockedIn, startLockIn } = useLockInSession();
  const policy = useQuery(api.lockInSolo.getLockInPointsPolicy, {});

  const canStart = Boolean(user?._id && user && !isLockedIn);

  async function onStart() {
    try {
      await startLockIn();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      Alert.alert("Could not start", message);
    }
  }

  return (
    <PlaceholderScreen title="Lock-In" subtitle="Solo focus session — earn points for eligible time.">
      {policy === undefined ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.card}>
          <Text style={styles.heading}>How points work</Text>
          <Text style={styles.body}>{policy.description}</Text>
          <Text style={styles.bullet}>
            • {policy.pointsPerFullInterval} points per {policy.intervalMinutes} minutes of eligible focus time
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
        </View>
      )}

      <View style={styles.actions}>
        {!user?._id ? (
          <Text style={styles.muted}>Sign in from Profile to use Lock-In.</Text>
        ) : (
          <>
            <Button
              title={isLockedIn ? "Session active (see fullscreen)" : "Start locked in"}
              onPress={() => void onStart()}
              disabled={!canStart}
            />
            {!isLockedIn ? (
              <Text style={styles.muted}>
                Starts a fullscreen session with a live timer. Tap &quot;End locked in&quot; to finish — points are
                added automatically from eligible duration.
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
    marginTop: 8,
    marginBottom: 16
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827"
  },
  body: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 12
  },
  bullet: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 18
  },
  actions: {
    gap: 12,
    marginTop: 8
  },
  muted: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18
  }
});
