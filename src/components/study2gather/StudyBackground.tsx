import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { sg } from "@/theme/study2gatherUi";

/** Dark gradient shell + soft color orbs (ported from Next splash/login). */
export function StudyBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={styles.orbEmerald} />
      <View style={styles.orbAmber} />
      <View style={styles.orbCyan} />
      <View style={styles.gridHint} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: sg.bg,
    overflow: "hidden"
  },
  orbEmerald: {
    position: "absolute",
    top: "12%",
    left: "-8%",
    width: 280,
    height: 280,
    borderRadius: 200,
    backgroundColor: sg.orbEmerald
  },
  orbAmber: {
    position: "absolute",
    bottom: "18%",
    right: "-10%",
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: sg.orbAmber
  },
  orbCyan: {
    position: "absolute",
    top: "42%",
    right: "15%",
    width: 200,
    height: 200,
    borderRadius: 200,
    backgroundColor: sg.orbCyan
  },
  gridHint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    borderWidth: 0
  }
});
