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
}

export function FormField({
  label,
  hint,
  error,
  required,
  style,
  children,
  ...rest
}: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label} accessibilityRole="text">
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      </View>
      {hint ? (
        <Text style={styles.hint} accessibilityRole="text">
          {hint}
        </Text>
      ) : null}
      {children ?? (
        <TextInput
          placeholderTextColor="#9CA3AF"
          style={[styles.input, error ? styles.inputError : null, style]}
          accessibilityLabel={label}
          {...rest}
        />
      )}
      {error ? (
        <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
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
  inputError: {
    borderColor: "#DC2626",
    borderWidth: 2,
    backgroundColor: "#FFFBFB"
  },
  error: { marginTop: 8, fontSize: 13, color: "#B91C1C", fontWeight: "600", lineHeight: 18 }
});
