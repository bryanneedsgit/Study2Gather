import { DefaultTheme } from "@react-navigation/native";
import { colors } from "@/theme/colors";

export const theme = {
  colors,
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
