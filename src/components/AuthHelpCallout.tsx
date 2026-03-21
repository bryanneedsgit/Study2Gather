import { StyleSheet, Text, View } from "react-native";

export function AuthHelpCallout({ theme = "default" }: { theme?: "default" | "dark" }) {
  const d = theme === "dark";
  return (
    <View style={[styles.box, d && styles.boxDark]}>
      <Text style={[styles.title, d && styles.titleDark]}>Troubleshooting</Text>
      <Text style={[styles.line, d && styles.lineDark]}>• Run Convex in another terminal: npm run convex:dev</Text>
      <Text style={[styles.line, d && styles.lineDark]}>• Set EXPO_PUBLIC_CONVEX_URL in .env (see .env.example)</Text>
      <Text style={[styles.line, d && styles.lineDark]}>• Restart Expo after changing .env</Text>
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
  boxDark: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)"
  },
  title: { fontWeight: "700", color: "#111827", marginBottom: 10, fontSize: 14 },
  titleDark: { color: "rgba(255,255,255,0.85)" },
  line: { fontSize: 13, color: "#4B5563", lineHeight: 20, marginBottom: 6 },
  lineDark: { color: "rgba(255,255,255,0.55)" }
});
