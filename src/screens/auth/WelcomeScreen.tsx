import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogoMark } from "@/components/study2gather/LogoMark";
import { StudyBackground } from "@/components/study2gather/StudyBackground";
import type { AuthStackParamList } from "@/navigation/types";
import { sg } from "@/theme/study2gatherUi";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Welcome">;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <StudyBackground>
        <View style={styles.body}>
          <View style={styles.hero}>
            <LogoMark size={112} />
            <Text style={styles.brand}>Study2Gather</Text>
            <Text style={styles.tagline}>Beat burnout. Study together.</Text>
            <Text style={styles.blurb}>
              Match with study partners, lock in focus sessions, and earn rewards — all in one place.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.92}
              style={styles.ctaWrap}
              onPress={() => navigation.navigate("SignIn")}
            >
              <LinearGradient
                colors={["#10b981", "#06b6d4", "#f59e0b"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Sign in</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.hint}>School email and password on the next screen.</Text>
          </View>
        </View>
      </StudyBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: sg.bg },
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: "space-between",
    maxWidth: 440,
    width: "100%",
    alignSelf: "center"
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 24
  },
  brand: {
    marginTop: 20,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: sg.emerald
  },
  tagline: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "600",
    color: sg.textSoft,
    textAlign: "center"
  },
  blurb: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
    color: sg.textMuted,
    textAlign: "center",
    paddingHorizontal: 8
  },
  actions: {
    width: "100%",
    gap: 12
  },
  ctaWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6
  },
  cta: {
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54
  },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  hint: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    lineHeight: 18
  }
});
