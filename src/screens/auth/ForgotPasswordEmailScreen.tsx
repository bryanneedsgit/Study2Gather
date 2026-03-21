import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { FormField } from "@/components/FormField";
import { StudyBackground } from "@/components/study2gather/StudyBackground";
import type { AuthStackParamList } from "@/navigation/types";
import { sg } from "@/theme/study2gatherUi";

type Nav = NativeStackNavigationProp<AuthStackParamList, "ForgotPasswordEmail">;

export function ForgotPasswordEmailScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState("");

  const onContinue = () => {
    navigation.navigate("ForgotPasswordOtp", { email: email.trim() || "—" });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StudyBackground>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.back}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset password</Text>
              <Text style={styles.cardSubtitle}>
                Enter the email for your account. We&apos;ll send a one-time code to verify it&apos;s you.
              </Text>

              <FormField
                theme="dark"
                label="Email"
                required
                hint="School or personal email you used to register."
                value={email}
                onChangeText={setEmail}
                placeholder="you@school.edu"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <TouchableOpacity onPress={onContinue} activeOpacity={0.92} style={styles.ctaWrap}>
                <LinearGradient
                  colors={["#10b981", "#06b6d4", "#f59e0b"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cta}
                >
                  <Text style={styles.ctaText}>Send code</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </StudyBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: sg.bg },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
    maxWidth: 440,
    width: "100%",
    alignSelf: "center"
  },
  back: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingVertical: 8,
    paddingRight: 12
  },
  backText: {
    fontSize: 15,
    fontWeight: "700",
    color: sg.cyan
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: sg.borderGlass,
    backgroundColor: sg.cardGlass
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: sg.text,
    textAlign: "center",
    marginBottom: 6
  },
  cardSubtitle: {
    fontSize: 14,
    color: sg.textSoft,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20
  },
  ctaWrap: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6
  },
  cta: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52
  },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" }
});
