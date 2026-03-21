import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { LogoMark } from "@/components/study2gather/LogoMark";
import { StudyBackground } from "@/components/study2gather/StudyBackground";
import { sg } from "@/theme/study2gatherUi";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading…" }: LoadingScreenProps) {
  return (
    <StudyBackground>
      <View style={styles.container}>
        <LogoMark size={72} />
        <ActivityIndicator size="large" color={sg.cyan} style={styles.spinner} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </StudyBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  spinner: { marginTop: 24 },
  text: { marginTop: 16, fontSize: 16, color: sg.textMuted, fontWeight: "600" }
});
