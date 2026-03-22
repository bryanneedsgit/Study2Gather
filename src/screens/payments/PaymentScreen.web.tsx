import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAction, useQuery } from "convex/react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { api } from "@/lib/convexApi";
import { STRIPE_CURRENCY, STRIPE_PUBLISHABLE_KEY } from "@/lib/stripeConfig";
import type { MainAppStackParamList } from "@/navigation/types";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";
import { WebStripePaymentForm } from "@/screens/payments/WebStripePaymentForm";
import { useFinalizeReservationAfterPayment } from "@/screens/payments/useFinalizeReservationAfterPayment";
import { useFinalizeSpotCheckinPayment } from "@/screens/payments/useFinalizeSpotCheckinPayment";

const DEFAULT_AMOUNT_CENTS = 500;

function formatMoney(amountCents: number, currency: string): string {
  const major = amountCents / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(
      major
    );
  } catch {
    return `${major.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function PaymentMissingConfig() {
  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.flex}>
      <Text style={styles.body}>
        Add <Text style={styles.mono}>EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY</Text> to your Expo env and set{" "}
        <Text style={styles.mono}>STRIPE_SECRET_KEY</Text> in the Convex dashboard. Restart{" "}
        <Text style={styles.mono}>npm run web</Text> after changing env.
      </Text>
    </ScrollView>
  );
}

function PaymentBackendOffline() {
  return (
    <View style={[styles.flex, styles.centered]}>
      <Text style={styles.body}>
        Stripe is not configured on the server. Set <Text style={styles.mono}>STRIPE_SECRET_KEY</Text> in Convex
        environment variables.
      </Text>
    </View>
  );
}

/**
 * Web: real checkout via Stripe Payment Element (no `@stripe/stripe-react-native`).
 */
export function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainAppStackParamList, "Payment">>();
  const amountCents = route.params?.amountCents ?? DEFAULT_AMOUNT_CENTS;
  const description = route.params?.description ?? "Study2Gather";

  const backend = useQuery(api.payments.paymentsBackendReady);
  const createPaymentIntent = useAction(api.payments.createPaymentIntent);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);

  const amountLabel = useMemo(() => formatMoney(amountCents, STRIPE_CURRENCY), [amountCents]);

  const stripePromise = useMemo(() => {
    if (!STRIPE_PUBLISHABLE_KEY) return null;
    return loadStripe(STRIPE_PUBLISHABLE_KEY);
  }, []);

  const bootstrapIntent = useCallback(async () => {
    setIntentError(null);
    setClientSecret(null);
    try {
      const { clientSecret: secret } = await createPaymentIntent({
        amountCents,
        currency: STRIPE_CURRENCY,
        description
      });
      setClientSecret(secret);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("stripe_not_configured")) {
        setIntentError("Server Stripe key missing (STRIPE_SECRET_KEY in Convex).");
      } else if (msg.includes("unauthenticated")) {
        setIntentError("Sign in to pay.");
      } else {
        setIntentError(msg);
      }
    }
  }, [amountCents, description, createPaymentIntent]);

  useEffect(() => {
    if (!STRIPE_PUBLISHABLE_KEY || !backend?.ready) return;
    void bootstrapIntent();
  }, [STRIPE_PUBLISHABLE_KEY, backend?.ready, bootstrapIntent]);

  const finalizeReservation = useFinalizeReservationAfterPayment();
  const finalizeSpotCheckin = useFinalizeSpotCheckinPayment();

  const onPaid = useCallback(async () => {
    if (route.params?.afterPaySpotCheckin) {
      await finalizeSpotCheckin();
      return;
    }
    if (route.params?.afterPayReserve) {
      await finalizeReservation();
      return;
    }
    Alert.alert("Paid", "Your payment completed successfully.", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  }, [finalizeReservation, finalizeSpotCheckin, navigation, route.params]);

  if (!STRIPE_PUBLISHABLE_KEY || !stripePromise) {
    return <PaymentMissingConfig />;
  }

  if (backend === undefined) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!backend.ready) {
    return <PaymentBackendOffline />;
  }

  if (intentError) {
    return (
      <ScrollView contentContainerStyle={styles.scroll} style={styles.flex}>
        <Text style={styles.amount}>{amountLabel}</Text>
        <Text style={styles.err}>{intentError}</Text>
        <Text style={styles.linkHint} onPress={() => void bootstrapIntent()}>
          Tap to retry
        </Text>
      </ScrollView>
    );
  }

  if (!clientSecret) {
    return (
      <View style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingHint}>Loading secure checkout…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.flex} keyboardShouldPersistTaps="handled">
      <Text style={styles.amount}>{amountLabel}</Text>
      <Text style={styles.caption}>Pay with card, Link, or wallets (if enabled in Stripe)</Text>

      <Elements
        key={clientSecret}
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: colors.primary,
              colorBackground: colors.backgroundElevated,
              colorText: colors.textPrimary,
              colorDanger: colors.danger,
              borderRadius: "12px",
              fontFamily: "system-ui, -apple-system, sans-serif"
            }
          }
        }}
      >
        <WebStripePaymentForm amountLabel={amountLabel} onPaid={onPaid} />
      </Elements>

      <Text style={styles.legal}>
        Payments are processed by Stripe. Turn on Apple Pay / Google Pay for the web in your Stripe Dashboard if you
        want wallet buttons here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: space.lg,
    paddingBottom: space.xl * 2,
    gap: space.md
  },
  centered: { justifyContent: "center", alignItems: "center", padding: space.lg, gap: space.md },
  amount: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center"
  },
  caption: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: space.sm
  },
  body: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
  err: { fontSize: 15, color: colors.danger, textAlign: "center", marginTop: space.md },
  linkHint: {
    fontSize: 15,
    color: colors.primary,
    textAlign: "center",
    marginTop: space.md,
    textDecorationLine: "underline"
  },
  loadingHint: { marginTop: space.md, color: colors.textSecondary, fontSize: 14 },
  legal: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: space.lg,
    textAlign: "center"
  }
});
