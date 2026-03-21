import { ReactNode } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  /** Shown under the label, above the input */
  hint?: string;
  error?: string | null;
  /** Show a subtle "required" marker on the label */
  required?: boolean;
  children?: ReactNode;
  /** `dark` matches Study2Gather v0 auth/onboarding shell */
  theme?: "default" | "dark";
}

export function FormField({
  label,
  hint,
  error,
  required,
  style,
  children,
  theme = "default",
  ...rest
}: FormFieldProps) {
  const d = theme === "dark";
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, d && styles.labelDark]} accessibilityRole="text">
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>
      {hint ? (
        <Text style={[styles.hint, d && styles.hintDark]} accessibilityRole="text">
          {hint}
        </Text>
      ) : null}
      {children ?? (
        <TextInput
          placeholderTextColor={d ? "rgba(255,255,255,0.35)" : "#9CA3AF"}
          style={[
            styles.input,
            d && styles.inputDark,
            error ? (d ? styles.inputErrorDark : styles.inputError) : null,
            style
          ]}
          accessibilityLabel={label}
          {...rest}
        />
      )}
      {error ? (
        <Text style={[styles.error, d && styles.errorDark]} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  labelRow: { marginBottom: 6 },
  label: { fontSize: 15, fontWeight: "700", color: "#111827", letterSpacing: -0.2 },
  required: { color: "#DC2626", fontWeight: "700" },
  hint: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF"
  },
  inputDark: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#FFFFFF"
  },
  inputError: {
    borderColor: "#DC2626",
    borderWidth: 2,
    backgroundColor: "#FFFBFB"
  },
  inputErrorDark: {
    borderColor: "#F87171",
    borderWidth: 2,
    backgroundColor: "rgba(127,29,29,0.25)"
  },
  labelDark: { color: "rgba(255,255,255,0.75)" },
  hintDark: { color: "rgba(255,255,255,0.45)" },
  error: { marginTop: 8, fontSize: 13, color: "#B91C1C", fontWeight: "600", lineHeight: 18 },
  errorDark: { color: "#FCA5A5" }
});
