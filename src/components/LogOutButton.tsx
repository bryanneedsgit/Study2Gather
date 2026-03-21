import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useSession } from "@/context/SessionContext";
import { colors } from "@/theme/colors";

/** Full-width control on Profile (web + native). */
export function ProfileLogOutButton() {
  const { signOut } = useSession();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Log out"
      style={styles.block}
      onPress={() => void signOut()}
      activeOpacity={0.85}
    >
      <Text style={styles.blockTitle}>Log out</Text>
      <Text style={styles.blockHint}>You’ll return to the sign-in screen and can sign in again.</Text>
    </TouchableOpacity>
  );
}

/** Compact control for the native stack header (Profile tab). */
export function ProfileLogOutHeaderButton() {
  const { signOut } = useSession();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Log out"
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={() => void signOut()}
      style={styles.headerBtn}
    >
      <Text style={styles.headerText}>Log out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  block: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B91C1C",
    textAlign: "center"
  },
  blockHint: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18
  },
  headerBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  headerText: { fontSize: 16, fontWeight: "600", color: "#B91C1C" }
});
