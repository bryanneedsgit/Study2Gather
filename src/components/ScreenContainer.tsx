import { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/colors";
import { contentMaxWidth } from "@/theme/layout";

type ScreenContainerProps = {
  children: ReactNode;
  /** Default true — scroll when content overflows (most tab screens). */
  scroll?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

export function ScreenContainer({
  children,
  scroll = true,
  edges = ["top", "right", "bottom", "left"]
}: ScreenContainerProps) {
  const inner = <View style={styles.inner}>{children}</View>;

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
  }
});
