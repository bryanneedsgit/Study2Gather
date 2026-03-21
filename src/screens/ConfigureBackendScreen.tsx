import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

export function ConfigureBackendScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Convex URL required</Text>
      <Text style={styles.body}>
        Add EXPO_PUBLIC_CONVEX_URL to your .env file (see .env.example), then restart Expo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.background },
  title: { fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginBottom: 8 },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 24 }
});
