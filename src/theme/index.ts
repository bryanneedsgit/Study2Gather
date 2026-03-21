import { DefaultTheme } from "@react-navigation/native";
import { colors } from "@/theme/colors";
import { radius, space, contentMaxWidth } from "@/theme/layout";

export const theme = {
  colors,
  radius,
  space,
  contentMaxWidth,
  navigationTheme: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary
    }
  }
} as const;
