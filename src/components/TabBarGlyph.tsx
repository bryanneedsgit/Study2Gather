import { StyleSheet, Text } from "react-native";

/**
 * Monochrome tab icons — no `@expo/vector-icons` dependency (avoids web/Metro resolve issues).
 */
export function tabBarGlyph(letter: string) {
  return function TabGlyph({ color, size }: { color: string; size: number }) {
    return (
      <Text style={[styles.glyph, { color, fontSize: Math.min(size + 2, 22) }]}>{letter}</Text>
    );
  };
}

const styles = StyleSheet.create({
  glyph: {
    fontWeight: "800",
    textAlign: "center",
    minWidth: 24
  }
});
