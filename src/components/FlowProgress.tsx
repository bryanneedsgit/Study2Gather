import { StyleSheet, Text, View } from "react-native";

type Props = {
  currentStep: number;
  totalSteps: number;
  subtitle?: string;
};

export function FlowProgress({ currentStep, totalSteps, subtitle }: Props) {
  const pct = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  return (
    <View style={styles.wrap} accessibilityRole="progressbar">
      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
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
  }
});
