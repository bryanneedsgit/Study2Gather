import { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoutLink } from "@/components/HeaderLogoutButton";
import { colors } from "@/theme/colors";
import { contentMaxWidth, space } from "@/theme/layout";

type ScreenContainerProps = {
  children: ReactNode;
  /** Default true — scroll when content overflows (most tab screens). */
  scroll?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
  /** Top row: screen title + compact Log out (same on every tab). */
  tabTitle?: string;
};

export function ScreenContainer({
  children,
  scroll = true,
  edges = ["top", "right", "bottom", "left"],
  tabTitle
}: ScreenContainerProps) {
  const inner = (
    <View style={[styles.inner, !scroll && styles.innerFill]}>
      {tabTitle ? (
        <View style={styles.tabHeader}>
          <Text style={styles.tabHeaderTitle} numberOfLines={1}>
            {tabTitle}
          </Text>
          <LogoutLink size="header" />
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28
  },
  inner: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? contentMaxWidth : undefined,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 8
  },
  innerFill: {
    flex: 1
  },
  tabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    marginBottom: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tabHeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.4
  }
});
