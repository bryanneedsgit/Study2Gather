import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
  children?: ReactNode;
}

export function PlaceholderScreen({ title, subtitle, children }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF"
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827"
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#4B5563"
  },
  content: {
    marginTop: 16
  }
});
