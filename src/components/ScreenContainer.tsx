import { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoutLink } from "@/components/HeaderLogoutButton";
import { AnimatedLogoMark } from "@/components/study2gather/AnimatedLogoMark";
import { StudyBackground } from "@/components/study2gather/StudyBackground";
import { colors } from "@/theme/colors";
import { contentMaxWidth, space } from "@/theme/layout";

type ScreenContainerProps = {
  children: ReactNode;
  /** Default true — scroll when content overflows (most tab screens). */
  scroll?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
  /** Used for accessibility only (bottom tab shows the screen name). */
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
        <View style={styles.tabHeader} accessibilityRole="header">
          <View style={styles.tabHeaderBrand} accessible accessibilityLabel={tabTitle} accessibilityHint="Study2Gather">
            <AnimatedLogoMark size={42} />
          </View>
          <LogoutLink size="header" />
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <StudyBackground>
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
    </StudyBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent"
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
  tabHeaderBrand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  }
});
