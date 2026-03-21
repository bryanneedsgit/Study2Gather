import { sg } from "@/theme/study2gatherUi";

/**
 * App-wide palette aligned with the v0 export (`b_3vxuKqNMmIx-1774098640410`): dark shell + emerald/cyan/amber.
 */
export const colors = {
  background: sg.bg,
  backgroundElevated: "#121a2a",
  card: "rgba(255,255,255,0.06)",
  cardMuted: "rgba(255,255,255,0.04)",
  textPrimary: "#F8FAFC",
  textSecondary: "rgba(255,255,255,0.65)",
  textMuted: "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.1)",
  borderStrong: "rgba(255,255,255,0.18)",
  primary: sg.cyan,
  primaryPressed: "#06b6d4",
  primaryMuted: "rgba(34, 211, 238, 0.15)",
  accent: sg.emerald,
  accentMuted: "rgba(74, 222, 128, 0.12)",
  success: "#34d399",
  successMuted: "rgba(52, 211, 153, 0.15)",
  warning: sg.amber,
  danger: "#f87171",
  tabBar: "#0f1623",
  tabBarBorder: "rgba(255,255,255,0.08)",
  tabInactive: "rgba(255,255,255,0.4)",
  chipBg: "rgba(255,255,255,0.06)",
  chipBorder: "rgba(255,255,255,0.12)",
  heroGradientTop: "rgba(16, 185, 129, 0.12)",
  heroGradientBottom: sg.bg
} as const;
