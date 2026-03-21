import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useQuery } from "convex/react";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useSession } from "@/context/SessionContext";
import { useLockInSession } from "@/context/LockInSessionContext";
import { api } from "@/lib/convexApi";
import { mapVenueCheckInError, useVenueCheckIn } from "@/hooks/useVenueCheckIn";

export function LockInScreen() {
  const { user } = useSession();
  const { isLockedIn, startLockIn } = useLockInSession();
  const policy = useQuery(api.lockInSolo.getLockInPointsPolicy, {});
  const locationCheckIn = useQuery(api.locationCheckIn.getActiveLocationCheckIn, user?._id ? {} : "skip");
  const { runCheckIn, isCheckingIn } = useVenueCheckIn();
  const [qrDraft, setQrDraft] = useState("");

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

  async function onVerifyLocation() {
    try {
      await runCheckIn(qrDraft);
      setQrDraft("");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const { userMessage } = mapVenueCheckInError(message);
      Alert.alert("Check-in failed", userMessage);
    }
  }

  const loadingPolicy = policy === undefined || locationCheckIn === undefined;

  return (
    <PlaceholderScreen title="Lock-In" subtitle="Solo focus session — earn points for eligible time.">
      {loadingPolicy ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.card}>
          <Text style={styles.heading}>How points work</Text>
          <Text style={styles.body}>{policy.description}</Text>
          <Text style={styles.bullet}>
            • {policy.pointsPerEligibleMinute} point per minute of eligible focus time
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

      {user?._id && !isLockedIn && locationCheckIn !== undefined ? (
        <View style={styles.checkInCard}>
          <Text style={styles.checkInTitle}>Venue check-in</Text>
          {locationCheckIn === null ? (
            <>
              <Text style={styles.muted}>
                Scan the venue QR code (or paste the raw payload below for testing). We request your location once to
                confirm you&apos;re at the recorded spot — then you can start locked in.
              </Text>
              <TextInput
                style={styles.qrInput}
                placeholder='e.g. s2g:spot:… or {"v":1,"t":"spot","id":"…"}'
                placeholderTextColor="#9ca3af"
                value={qrDraft}
                onChangeText={setQrDraft}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isCheckingIn}
              />
              <Button
                title={isCheckingIn ? "Getting location…" : "Verify location & unlock"}
                onPress={() => void onVerifyLocation()}
                disabled={isCheckingIn || !qrDraft.trim()}
              />
            </>
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
                {locationCheckIn === null
                  ? "Complete venue check-in above first — then Start locked in unlocks."
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
    marginTop: 8,
    marginBottom: 16
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
  qrInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff"
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
