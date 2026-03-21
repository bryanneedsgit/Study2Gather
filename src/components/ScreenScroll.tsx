import { ReactNode } from "react";
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type ScreenScrollProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/** Full-height scroll for tab screens that need vertical overflow on web. */
export function ScreenScroll({ children, contentContainerStyle }: ScreenScrollProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 32 }
});
