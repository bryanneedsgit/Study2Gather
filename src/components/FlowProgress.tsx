import { StyleSheet, Text, View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps: number;
  subtitle?: string;
  theme?: "default" | "dark";
};

export function FlowProgress({ currentStep, totalSteps, subtitle, theme = "default" }: Props) {
  const pct = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  const d = theme === "dark";
  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <Text style={[styles.stepText, d && styles.stepTextDark]}>
        Step {currentStep} of {totalSteps}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, d && styles.subtitleDark]}>{subtitle}</Text> : null}
      <View style={[styles.track, d && styles.trackDark]}>
        <View style={[styles.fill, d && styles.fillDark, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  stepText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    letterSpacing: 0.3,
    textTransform: "uppercase"
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
    letterSpacing: -0.3
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    minWidth: 4,
    borderRadius: 999,
    backgroundColor: "#2563EB"
  },
  stepTextDark: { color: "#4ade80" },
  subtitleDark: { color: "rgba(255,255,255,0.92)" },
  trackDark: { backgroundColor: "rgba(255,255,255,0.12)" },
  fillDark: { backgroundColor: "#22d3ee" }
});
