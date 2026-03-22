import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Tab bar icons via Ionicons (Expo). Matches React Navigation’s `tabBarIcon({ color, size })`.
 */
export function tabBarIonicon(name: IoniconName) {
  return function TabIonicon({
    color,
    size
  }: {
    focused?: boolean;
    color: string;
    size: number;
  }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}
