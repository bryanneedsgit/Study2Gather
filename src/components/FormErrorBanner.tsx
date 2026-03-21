import { StyleSheet, Text, View } from "react-native";

type Props = {
  message: string | null | undefined;
};

/** High-visibility message for server / network errors on forms */
export function FormErrorBanner({ message }: Props) {
  if (!message) return null;
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  body: { fontSize: 14, color: "#7F1D1D", lineHeight: 20, fontWeight: "500" }
});
