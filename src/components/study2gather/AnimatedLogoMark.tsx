import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LogoMark } from "@/components/study2gather/LogoMark";
import { colors } from "@/theme/colors";
import { sg } from "@/theme/study2gatherUi";

type Props = {
  /** Display size for the logo image (default tuned for tab headers). */
  size?: number;
};

/**
 * Brand mark with continuous subtle motion: breathe scale, gentle wobble, and a pulsing ring.
 */
export function AnimatedLogoMark({ size = 42 }: Props) {
  const breathe = useRef(new Animated.Value(0)).current;
  const wobble = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, duration: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(v, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ])
      );

    loop(breathe, 2_600, 0).start();
    loop(wobble, 3_400, 200).start();
    loop(ring, 2_000, 0).start();
  }, [breathe, wobble, ring]);

  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.055] });
  const rotate = wobble.interpolate({ inputRange: [0, 1], outputRange: ["-2.2deg", "2.2deg"] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });

  const ringBase = size + 26;
  const box = size + 36;
  const ringInset = (box - ringBase) / 2;

  return (
    <View style={[styles.wrap, { width: box, height: box }]} accessibilityElementsHidden>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            left: ringInset,
            top: ringInset,
            width: ringBase,
            height: ringBase,
            borderRadius: ringBase * 0.28,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }]
          }
        ]}
      />
      <Animated.View style={{ transform: [{ scale }, { rotate }] }}>
        <LogoMark size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: sg.cyan,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12
  }
});
