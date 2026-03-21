import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "@/context/SessionContext";
import { colors } from "@/theme/colors";

/** Compact “Log out” for nav headers (all main tabs). */
export function HeaderLogoutButton() {
  return (
    <View style={styles.headerWrap}>
      <LogoutLink size="header" />
    </View>
  );
}

/** Same action, for in-screen rows (e.g. Check-In overlay). `tone="light"` for dark camera chrome. */
export function LogoutLink({
  size = "inline",
  tone = "default"
}: {
  size?: "header" | "inline";
  tone?: "default" | "light";
}) {
  const { signOut } = useSession();
  const textStyle =
    tone === "light"
      ? styles.textLight
      : size === "header"
        ? styles.textHeader
        : styles.textInline;
  return (
    <TouchableOpacity
      onPress={() => void signOut()}
      style={size === "header" ? styles.hitHeader : styles.hitInline}
      accessibilityRole="button"
      accessibilityLabel="Log out and return to sign in"
      activeOpacity={0.85}
    >
      <Text style={textStyle}>Log out</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    marginRight: 4
  },
  hitHeader: {
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  hitInline: {
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  textHeader: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "800"
  },
  textInline: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "800"
  },
  textLight: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    fontWeight: "800"
  }
});
