import { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LogoMark } from "@/components/study2gather/LogoMark";
import { StudyBackground } from "@/components/study2gather/StudyBackground";
import { sg } from "@/theme/study2gatherUi";

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
    <StudyBackground>
      <StatusBar style="light" />
      <Animated.View style={[styles.center, { opacity }]} accessibilityRole="none">
        <View style={styles.logoWrap}>
          <View style={styles.glow} />
          <LogoMark size={96} />
        </View>

        <Text style={styles.title}>Study2Gather</Text>

        <Text style={styles.tagline}>Beat burnout. Study together.</Text>

        <View style={styles.featuresRow}>
          <Text style={styles.featureFocus}>focus</Text>
          <View style={styles.dot} />
          <Text style={styles.featureConnect}>connect</Text>
          <View style={styles.dot} />
          <Text style={styles.featureReward}>reward</Text>
        </View>
      </Animated.View>
    </StudyBackground>
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
  title: {
    marginTop: 4,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: sg.emerald
  },
  tagline: {
    marginTop: 12,
    fontSize: 14,
    color: sg.textMuted,
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
