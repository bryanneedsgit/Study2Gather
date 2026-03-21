import { StyleSheet, Text, View } from "react-native";

export function AuthHelpCallout() {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Troubleshooting</Text>
      <Text style={styles.line}>• Run Convex in another terminal: npm run convex:dev</Text>
      <Text style={styles.line}>• Set EXPO_PUBLIC_CONVEX_URL in .env (see .env.example)</Text>
      <Text style={styles.line}>• Restart Expo after changing .env</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB"
  },
  title: { fontWeight: "700", color: "#111827", marginBottom: 10, fontSize: 14 },
  line: { fontSize: 13, color: "#4B5563", lineHeight: 20, marginBottom: 6 }
});
