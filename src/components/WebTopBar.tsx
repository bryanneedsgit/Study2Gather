import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "@/context/SessionContext";
import { colors } from "@/theme/colors";

/** Sticky bar on web so Log out is always visible (not only on Profile). */
export function WebTopBar() {
  const { signOut } = useSession();

  if (Platform.OS !== "web") {
    return null;
  }

  return (
    <View style={styles.bar}>
      <Text style={styles.brand} accessibilityRole="header">
        Study2Gather
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={styles.logoutBtn}
        onPress={() => void signOut()}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  brand: { fontSize: 17, fontWeight: "800", color: colors.textPrimary, letterSpacing: -0.3 },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2"
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: "#B91C1C" }
});
