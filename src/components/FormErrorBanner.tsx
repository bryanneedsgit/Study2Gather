import { StyleSheet, Text, View } from "react-native";

type Props = {
  message: string | null | undefined;
  theme?: "default" | "dark";
};

/** High-visibility message for server / network errors on forms */
export function FormErrorBanner({ message, theme = "default" }: Props) {
  if (!message) return null;
  const d = theme === "dark";
  return (
    <View style={[styles.box, d && styles.boxDark]} accessibilityRole="alert">
      <Text style={[styles.body, d && styles.bodyDark]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  boxDark: {
    backgroundColor: "rgba(127,29,29,0.35)",
    borderColor: "rgba(248,113,113,0.45)"
  },
  body: { fontSize: 14, color: "#7F1D1D", lineHeight: 20, fontWeight: "500" },
  bodyDark: { color: "#FECACA" }
});
