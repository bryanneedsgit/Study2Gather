import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

type AppCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** Softer background for nested sections */
  muted?: boolean;
};

export function AppCard({ children, style, muted }: AppCardProps) {
  return (
    <View style={[styles.card, muted && styles.cardMuted, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2
  },
  cardMuted: {
    backgroundColor: colors.cardMuted
  }
});
