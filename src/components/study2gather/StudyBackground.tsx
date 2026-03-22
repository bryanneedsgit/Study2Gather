import { ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { sg } from "@/theme/study2gatherUi";

/**
 * Dark shell + soft color orbs with slow drift (ported from Next splash/login, now animated).
 * Uses native-driver friendly transforms only.
 */
export function StudyBackground({ children }: { children: ReactNode }) {
  const driftA = useRef(new Animated.Value(0)).current;
  const driftB = useRef(new Animated.Value(0)).current;
  const driftC = useRef(new Animated.Value(0)).current;
  const driftD = useRef(new Animated.Value(0)).current;
  const mesh = useRef(new Animated.Value(0)).current;
  const meshB = useRef(new Animated.Value(0)).current;
  const gridPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wave = (v: Animated.Value, duration: number, delay = 0) =>
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

    wave(driftA, 8_800, 0).start();
    wave(driftB, 10_200, 350).start();
    wave(driftC, 7_600, 700).start();
    wave(driftD, 12_400, 200).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mesh, {
          toValue: 1,
          duration: 14_000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(mesh, {
          toValue: 0,
          duration: 14_000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(meshB, {
          toValue: 1,
          duration: 11_000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(meshB, {
          toValue: 0,
          duration: 11_000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(gridPulse, {
          toValue: 1,
          duration: 3_200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(gridPulse, {
          toValue: 0,
          duration: 3_200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [driftA, driftB, driftC, driftD, mesh, meshB, gridPulse]);

  const aTx = driftA.interpolate({ inputRange: [0, 1], outputRange: [0, 28] });
  const aTy = driftA.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const aScale = driftA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const bTx = driftB.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const bTy = driftB.interpolate({ inputRange: [0, 1], outputRange: [0, 28] });
  const bScale = driftB.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const cTx = driftC.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const cTy = driftC.interpolate({ inputRange: [0, 1], outputRange: [0, 20] });

  const dTx = driftD.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const dTy = driftD.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const dScale = driftD.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

  const meshOpacity = mesh.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.62] });
  const meshRotate = mesh.interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] });

  const meshBOpacity = meshB.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.28] });
  const meshBRotate = meshB.interpolate({ inputRange: [0, 1], outputRange: ["4deg", "-4deg"] });

  const gridOpacity = gridPulse.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.09] });

  return (
    <View style={styles.root} pointerEvents="box-none">
      <LinearGradient
        colors={["#0c1528", sg.bg, "#0d1324"]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.meshLayer,
          {
            opacity: meshOpacity,
            transform: [{ rotate: meshRotate }]
          }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(34,211,238,0.09)", "transparent", "rgba(74,222,128,0.08)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.meshLayer,
          {
            opacity: meshBOpacity,
            transform: [{ rotate: meshBRotate }]
          }
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["transparent", "rgba(167,139,250,0.07)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.orbEmerald,
          { transform: [{ translateX: aTx }, { translateY: aTy }, { scale: aScale }] }
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.orbAmber,
          { transform: [{ translateX: bTx }, { translateY: bTy }, { scale: bScale }] }
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.orbCyan, { transform: [{ translateX: cTx }, { translateY: cTy }] }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.orbViolet,
          { transform: [{ translateX: dTx }, { translateY: dTy }, { scale: dScale }] }
        ]}
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.ambientPulse, { opacity: gridOpacity }]}
      />

      <View style={styles.foreground} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: sg.bg,
    overflow: "hidden"
  },
  meshLayer: {
    ...StyleSheet.absoluteFillObject
  },
  foreground: {
    flex: 1
  },
  orbEmerald: {
    position: "absolute",
    top: "12%",
    left: "-8%",
    width: 300,
    height: 300,
    borderRadius: 200,
    backgroundColor: sg.orbEmerald
  },
  orbAmber: {
    position: "absolute",
    bottom: "18%",
    right: "-10%",
    width: 280,
    height: 280,
    borderRadius: 200,
    backgroundColor: sg.orbAmber
  },
  orbCyan: {
    position: "absolute",
    top: "42%",
    right: "12%",
    width: 220,
    height: 220,
    borderRadius: 200,
    backgroundColor: sg.orbCyan
  },
  orbViolet: {
    position: "absolute",
    bottom: "8%",
    left: "5%",
    width: 180,
    height: 180,
    borderRadius: 200,
    backgroundColor: "rgba(167, 139, 250, 0.14)"
  },
  ambientPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)"
  }
});
