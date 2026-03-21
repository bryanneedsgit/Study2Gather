import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { StudyNightBackground } from "@/components/study2gather/StudyNightBackground";
import { LogoMark } from "@/components/study2gather/LogoMark";
import { GradientTitle } from "@/components/study2gather/GradientTitle";
import { studyNight } from "@/theme/studyNight";

export function SplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [opacity]);

  return (
    <StudyNightBackground>
      <StatusBar style="dark" />
      <Animated.View style={[styles.center, { opacity }]} accessibilityRole="none">
        <View style={styles.logoWrap}>
          <View style={styles.glow} />
          <LogoMark size={96} />
        </View>

        <GradientTitle fontSize={40}>Study2Gather</GradientTitle>

        <Text style={styles.tagline}>Beat burnout. Study together.</Text>

        <View style={styles.featuresRow}>
          <Text style={styles.featureFocus}>focus</Text>
          <View style={styles.dot} />
          <Text style={styles.featureConnect}>connect</Text>
          <View style={styles.dot} />
          <Text style={styles.featureReward}>reward</Text>
        </View>
      </Animated.View>
    </StudyNightBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  logoWrap: {
    width: 112,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20
  },
  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16,185,129,0.15)"
  },
  tagline: {
    marginTop: 12,
    fontSize: 14,
    color: studyNight.textMuted,
    textAlign: "center"
  },
  featuresRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20
  },
  featureFocus: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginHorizontal: 6
  },
  featureConnect: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0891b2",
    marginHorizontal: 6
  },
  featureReward: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d97706",
    marginHorizontal: 6
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(100,116,139,0.35)"
  }
});
