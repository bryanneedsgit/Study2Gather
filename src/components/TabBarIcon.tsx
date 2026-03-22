import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

type IonName = ComponentProps<typeof Ionicons>["name"];

/**
 * Tab bar icons (Ionicons) — tints with `tabBarActiveTintColor` / `tabBarInactiveTintColor`.
 */
export function tabBarIcon(name: IonName) {
  return function TabIcon({ color, size }: { color: string; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };
}
