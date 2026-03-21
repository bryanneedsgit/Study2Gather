import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading…" }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 24
  },
  text: { marginTop: 12, fontSize: 16, color: "#4B5563" }
});
