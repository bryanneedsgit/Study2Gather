import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/ScreenContainer";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
  scroll?: boolean;
}

export function PlaceholderScreen({ title, subtitle, children, scroll = true }: PlaceholderScreenProps) {
  return (
    <ScreenContainer scroll={scroll} tabTitle={title}>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.content}>{children}</View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg
  },
  content: {
    marginTop: space.sm
  }
});
