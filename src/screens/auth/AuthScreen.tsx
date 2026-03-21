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
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthHelpCallout } from "@/components/AuthHelpCallout";
import { FlowProgress } from "@/components/FlowProgress";
import { FormErrorBanner } from "@/components/FormErrorBanner";
import { FormField } from "@/components/FormField";
import { env } from "@/config/env";
import { useSession } from "@/context/SessionContext";
import { formatUnknownError } from "@/utils/errors";
import { validateEmail } from "@/utils/validation";

export function AuthScreen() {
  const { signInWithEmail } = useSession();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    setFormError(null);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setSubmitting(true);
    try {
      await signInWithEmail(email.trim());
    } catch (e) {
      const raw = formatUnknownError(e);
      if (raw.toLowerCase().includes("invalid_email")) {
        setFormError("Invalid email. Please check and try again.");
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FlowProgress currentStep={1} totalSteps={2} subtitle="Account" />

          <Text style={styles.brand}>Study2Gather</Text>
          <Text style={styles.headline}>Sign in or create account</Text>
          <Text style={styles.lead}>
            New here? Enter your email and we’ll create your account. Same email next time signs you
            back in — no password in this demo.
          </Text>

          <View style={styles.card}>
            <FormField
              label="Email address"
              required
              hint="Use any address you can remember; it’s only used to find your account in this demo."
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

            <FormErrorBanner message={formError} />

            <TouchableOpacity
              style={[styles.primary, submitting && styles.primaryDisabled]}
              onPress={onSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>Continue with email</Text>
              )}
            </TouchableOpacity>

            {__DEV__ && env.convexUrl ? (
              <Text style={styles.devHint} numberOfLines={2}>
                Dev: Convex URL set ({env.convexUrl.slice(0, 40)}…)
              </Text>
            ) : null}
          </View>

          <AuthHelpCallout />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F3F4F6" },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40
  },
  brand: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
    marginBottom: 8
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    letterSpacing: -0.3
  },
  lead: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  primary: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8
  },
  primaryDisabled: { opacity: 0.65 },
  primaryText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  devHint: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 16,
    lineHeight: 16
  }
});
