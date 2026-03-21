import { StyleSheet, Text, View } from "react-native";

export function ConfigureBackendScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Convex URL required</Text>
      <Text style={styles.body}>
        Add EXPO_PUBLIC_CONVEX_URL to your .env file (see .env.example), then restart Expo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F9FAFB" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 8 },
  body: { fontSize: 16, color: "#4B5563", lineHeight: 24 }
});
