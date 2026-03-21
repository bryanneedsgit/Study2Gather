import { Button, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";

export function ProfileScreen() {
  const { user, signOut } = useSession();
  const smokeKey = user?.email?.replace(/[^a-z0-9]/gi, "-") ?? "profile-smoke-test";

  const backendStatus = useQuery(api.queries.getBackendHealth, { key: smokeKey });
  const increment = useMutation(api.mutations.incrementTestCounter);

  return (
    <PlaceholderScreen title="Profile" subtitle="Account and preferences.">
      {user ? (
        <View style={styles.account}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email ?? "—"}</Text>
          {user.school ? (
            <>
              <Text style={styles.label}>School</Text>
              <Text style={styles.value}>{user.school}</Text>
            </>
          ) : null}
          {user.course ? (
            <>
              <Text style={styles.label}>Course</Text>
              <Text style={styles.value}>{user.course}</Text>
            </>
          ) : null}
          {user.age != null ? (
            <>
              <Text style={styles.label}>Age</Text>
              <Text style={styles.value}>{String(user.age)}</Text>
            </>
          ) : null}
          <Text style={styles.label}>Points</Text>
          <Text style={styles.value}>{user.points}</Text>
        </View>
      ) : null}

      <Button title="Sign out" onPress={() => void signOut()} />

      <Text style={styles.section}>Developer: Convex smoke test</Text>
      <Text>{backendStatus ? `${backendStatus.message}. Count: ${backendStatus.count}` : "Loading…"}</Text>
      <View style={{ marginTop: 10 }}>
        <Button title="Increment test counter" onPress={() => increment({ key: smokeKey })} />
      </View>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  account: { marginBottom: 20 },
  label: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  value: { fontSize: 16, color: "#111827", fontWeight: "600" },
  section: { marginTop: 24, fontWeight: "600", color: "#374151" }
});
