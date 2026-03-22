import { PlatformPressable } from "@react-navigation/elements";
import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  type ViewStyle
} from "react-native";

import { useTabBarHover } from "@/context/TabBarHoverContext";
import { colors } from "@/theme/colors";
import type { MainTabParamList } from "@/navigation/types";

/** Hovered tab “pops”; other tabs ease down slightly for contrast. */
const HOVER_SCALE = 1.14;
const PEER_SCALE = 0.93;
const TIMING_IN = 180;
const TIMING_OUT = 220;

type Props = BottomTabBarButtonProps & {
  tabId: keyof MainTabParamList;
};

/**
 * Tab bar pressable with pointer-hover feedback (web / iPad pointer): primary tab
 * scales up; siblings scale down; plus cyan hover overlay on web.
 */
export function HoverableTabBarButton({ tabId, style, onHoverIn, onHoverOut, ...rest }: Props) {
  const { hoveredTabId, setHoveredTabId, clearHoverIfTab } = useTabBarHover();
  const scale = useRef(new Animated.Value(1)).current;

  const runScale = useCallback(
    (toValue: number, duration: number) => {
      Animated.timing(scale, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    },
    [scale]
  );

  useEffect(() => {
    let target = 1;
    if (hoveredTabId === null) {
      target = 1;
    } else if (hoveredTabId === tabId) {
      target = HOVER_SCALE;
    } else {
      target = PEER_SCALE;
    }
    const duration = hoveredTabId === null ? TIMING_OUT : TIMING_IN;
    runScale(target, duration);
  }, [hoveredTabId, tabId, runScale]);

  const handleHoverIn = useCallback(
    (e: Parameters<NonNullable<typeof onHoverIn>>[0]) => {
      setHoveredTabId(tabId);
      onHoverIn?.(e);
    },
    [onHoverIn, setHoveredTabId, tabId]
  );

  const handleHoverOut = useCallback(
    (e: Parameters<NonNullable<typeof onHoverOut>>[0]) => {
      clearHoverIfTab(tabId);
      onHoverOut?.(e);
    },
    [onHoverOut, clearHoverIfTab, tabId]
  );

  const flat = StyleSheet.flatten(style) as ViewStyle | undefined;
  const flex = flat?.flex;
  const isHovered = hoveredTabId === tabId;

  return (
    <Animated.View
      style={[
        {
          flex: flex ?? 1,
          minWidth: 0,
          transform: [{ scale }],
          zIndex: isHovered ? 3 : hoveredTabId != null ? 0 : 1,
          ...(Platform.OS === "android" && {
            elevation: isHovered ? 8 : 0
          })
        }
      ]}
    >
      <PlatformPressable
        {...rest}
        style={[style, { flex: 1 }]}
        hoverEffect={
          Platform.OS === "web"
            ? {
                color: colors.primary,
                hoverOpacity: 0.14,
                activeOpacity: 0.22
              }
            : undefined
        }
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
      />
    </Animated.View>
  );
}

/** Use on each `Tab.Screen` as `tabBarButton: hoverableTabButton("Discover")`. */
export function hoverableTabButton(tabId: keyof MainTabParamList) {
  return (props: BottomTabBarButtonProps) => (
    <HoverableTabBarButton {...props} tabId={tabId} />
  );
}
