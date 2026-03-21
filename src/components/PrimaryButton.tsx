import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: ViewStyle;
};

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = "primary",
  style
}: PrimaryButtonProps) {
  const isSecondary = variant === "secondary";
  const isDanger = variant === "danger";

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isSecondary && styles.secondary,
        isDanger && styles.danger,
        (disabled || loading) && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary && !isDanger ? colors.primary : "#FFFFFF"} />
      ) : (
        <Text
          style={[styles.label, isSecondary && styles.labelSecondary, isDanger && styles.labelDanger]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.md + 2,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44
  },
  secondary: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: "#C7D2FE"
  },
  danger: {
    backgroundColor: colors.danger
  },
  disabled: {
    opacity: 0.55
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  labelSecondary: {
    color: colors.primary
  },
  labelDanger: {
    color: "#FFFFFF"
  }
});
