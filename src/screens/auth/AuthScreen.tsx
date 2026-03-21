import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthHelpCallout } from "@/components/AuthHelpCallout";
import { FormErrorBanner } from "@/components/FormErrorBanner";
import { FormField } from "@/components/FormField";
import { LogoMark } from "@/components/study2gather/LogoMark";
import { StudyBackground } from "@/components/study2gather/StudyBackground";
import { env } from "@/config/env";
import { useSession } from "@/context/SessionContext";
import { sg } from "@/theme/study2gatherUi";
import { formatUnknownError } from "@/utils/errors";
import { validateEmail } from "@/utils/validation";

export function AuthScreen() {
  const { signInWithPassword } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    setFormError(null);
    const err = validateEmail(email);
    setEmailError(err);
    if (!password || password.length < 8) {
      setPasswordError("Use at least 8 characters.");
    } else {
      setPasswordError(null);
    }
    if (err || password.length < 8) return;

    setSubmitting(true);
    try {
      await signInWithPassword({
        email: email.trim(),
        password,
        flow
      });
    } catch (e) {
      const raw = formatUnknownError(e);
      if (
        raw.toLowerCase().includes("invalid") ||
        raw.toLowerCase().includes("credentials")
      ) {
        setFormError(
          flow === "signIn"
            ? "Wrong email or password. Try again or create an account."
            : "Could not create account. Try a different email or sign in instead."
        );
      } else if (
        raw.toLowerCase().includes("failed to fetch") ||
        raw.toLowerCase().includes("network")
      ) {
        setFormError(
          `Network error: ${raw}\n\nCheck Wi‑Fi and that Convex dev is running (npm run convex:dev).`
        );
      } else {
        setFormError(raw);
      }
    } finally {
      setSubmitting(false);
    }
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
            <View style={styles.header}>
              <LogoMark size={80} />
              <Text style={styles.brandGradient}>Study2Gather</Text>
              <Text style={styles.tagline}>Beat burnout. Study together.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{flow === "signIn" ? "Welcome back" : "Create account"}</Text>
              <Text style={styles.cardSubtitle}>
                {flow === "signIn"
                  ? "Ready to lock in with your squad?"
                  : "Join with your school email and a secure password."}
              </Text>

              <FormField
                theme="dark"
                label="Email"
                required
                hint="Used to sign in on this and other devices."
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setEmailError(null);
                  setFormError(null);
                }}
                placeholder="you@school.edu"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                error={emailError}
                editable={!submitting}
              />

              <FormField
                theme="dark"
                label="Password"
                required
                hint="At least 8 characters."
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setPasswordError(null);
                  setFormError(null);
                }}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
                autoComplete={flow === "signUp" ? "password-new" : "password"}
                error={passwordError}
                editable={!submitting}
              />

              <FormErrorBanner message={formError} theme="dark" />

              <TouchableOpacity
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.92}
                style={styles.ctaWrap}
              >
                <LinearGradient
                  colors={["#10b981", "#06b6d4", "#f59e0b"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.cta, submitting && styles.ctaDisabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.ctaText}>{flow === "signIn" ? "Lock in" : "Create account"}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchFlow}
                onPress={() => {
                  setFlow((f) => (f === "signIn" ? "signUp" : "signIn"));
                  setFormError(null);
                }}
                disabled={submitting}
              >
                <Text style={styles.switchFlowText}>
                  {flow === "signIn" ? "New here? Join the squad" : "Have an account? Sign in"}
                </Text>
              </TouchableOpacity>

              {__DEV__ && env.convexUrl ? (
                <Text style={styles.devHint} numberOfLines={2}>
                  Dev: Convex URL ({env.convexUrl.slice(0, 44)}…)
                </Text>
              ) : null}
            </View>

            <AuthHelpCallout theme="dark" />

            <Text style={styles.legal}>By continuing, you agree to the app&apos;s terms and privacy practices.</Text>
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
  header: {
    alignItems: "center",
    marginBottom: 28
  },
  brandGradient: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: sg.emerald
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    color: sg.textMuted
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
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  switchFlow: {
    marginTop: 18,
    alignItems: "center",
    paddingVertical: 8
  },
  switchFlowText: {
    color: sg.emerald,
    fontSize: 15,
    fontWeight: "700"
  },
  devHint: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginTop: 16,
    lineHeight: 16,
    textAlign: "center"
  },
  legal: {
    marginTop: 20,
    fontSize: 11,
    color: "rgba(255,255,255,0.28)",
    textAlign: "center",
    lineHeight: 16
  }
});
