import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useAction, useQuery } from "convex/react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import {
  CardField,
  PaymentIntent,
  PlatformPay,
  usePlatformPay,
  useStripe
} from "@stripe/stripe-react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppCard } from "@/components/AppCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { api } from "@/lib/convexApi";
import {
  STRIPE_CURRENCY,
  STRIPE_MERCHANT_COUNTRY,
  STRIPE_PUBLISHABLE_KEY
} from "@/lib/stripeConfig";
import type { MainAppStackParamList } from "@/navigation/types";
import { useFinalizeReservationAfterPayment } from "@/screens/payments/useFinalizeReservationAfterPayment";
import { useFinalizeSpotCheckinPayment } from "@/screens/payments/useFinalizeSpotCheckinPayment";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

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
        Add{" "}
        <Text style={styles.mono}>EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY</Text> to your Expo env and set{" "}
        <Text style={styles.mono}>STRIPE_SECRET_KEY</Text> in the Convex dashboard for this deployment. Rebuild the
        native app after enabling Apple Pay (merchant ID) in Xcode / App Store Connect.
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

type Method = "apple" | "google" | "card";

export function PaymentScreen() {
  const route = useRoute<RouteProp<MainAppStackParamList, "Payment">>();
  const amountCents = route.params?.amountCents ?? DEFAULT_AMOUNT_CENTS;
  const description = route.params?.description ?? "Study2Gather";

  if (!STRIPE_PUBLISHABLE_KEY) {
    return <PaymentMissingConfig />;
  }

  return <NativePaymentBody amountCents={amountCents} description={description} />;
}

function NativePaymentBody({
  amountCents,
  description
}: {
  amountCents: number;
  description: string;
}) {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<MainAppStackParamList, "Payment">>();
  const finalizeReservation = useFinalizeReservationAfterPayment();
  const finalizeSpotCheckin = useFinalizeSpotCheckinPayment();
  const backend = useQuery(api.payments.paymentsBackendReady);
  const createPaymentIntent = useAction(api.payments.createPaymentIntent);
  const { confirmPayment } = useStripe();
  const { confirmPlatformPayPayment, isPlatformPaySupported } = usePlatformPay();

  const onPaymentSucceeded = useCallback(async () => {
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

  /** Default to card so the Stripe gateway is visible immediately. */
  const [method, setMethod] = useState<Method>("card");
  const [busy, setBusy] = useState(false);
  const [appleOk, setAppleOk] = useState(false);
  const [googleOk, setGoogleOk] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const amountLabel = useMemo(
    () => formatMoney(amountCents, STRIPE_CURRENCY),
    [amountCents]
  );

  const decimalAmount = useMemo(() => (amountCents / 100).toFixed(2), [amountCents]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (Platform.OS === "ios") {
        const ok = await isPlatformPaySupported();
        if (!cancelled) setAppleOk(ok);
      } else if (Platform.OS === "android") {
        const ok = await isPlatformPaySupported({
          googlePay: { testEnv: __DEV__ }
        });
        if (!cancelled) setGoogleOk(ok);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPlatformPaySupported]);

  const runPayment = useCallback(async () => {
    if (backend && !backend.ready) {
      Alert.alert("Payments unavailable", "Stripe secret key is not set on the server.");
      return;
    }
    if (method === "card" && !cardComplete) {
      Alert.alert("Card incomplete", "Enter a valid card in the secure field.");
      return;
    }
    if (method === "apple" && !appleOk) {
      Alert.alert("Apple Pay", "Apple Pay is not available on this device.");
      return;
    }
    if (method === "google" && !googleOk) {
      Alert.alert("Google Pay", "Google Pay is not available on this device.");
      return;
    }

    setBusy(true);
    try {
      const { clientSecret } = await createPaymentIntent({
        amountCents,
        currency: STRIPE_CURRENCY,
        description
      });

      if (method === "apple") {
        const { error, paymentIntent } = await confirmPlatformPayPayment(clientSecret, {
          applePay: {
            merchantCountryCode: STRIPE_MERCHANT_COUNTRY,
            currencyCode: STRIPE_CURRENCY.toUpperCase(),
            cartItems: [
              {
                paymentType: PlatformPay.PaymentType.Immediate,
                label: description,
                amount: decimalAmount
              }
            ]
          }
        });
        if (error) {
          if (error.code !== "Canceled") {
            Alert.alert("Apple Pay", error.message ?? "Payment failed");
          }
          return;
        }
        if (paymentIntent?.status === PaymentIntent.Status.Succeeded) {
          await onPaymentSucceeded();
        }
        return;
      }

      if (method === "google") {
        const { error, paymentIntent } = await confirmPlatformPayPayment(clientSecret, {
          googlePay: {
            testEnv: __DEV__,
            merchantCountryCode: STRIPE_MERCHANT_COUNTRY,
            currencyCode: STRIPE_CURRENCY.toUpperCase(),
            merchantName: "Study2Gather",
            label: description
          }
        });
        if (error) {
          if (error.code !== "Canceled") {
            Alert.alert("Google Pay", error.message ?? "Payment failed");
          }
          return;
        }
        if (paymentIntent?.status === PaymentIntent.Status.Succeeded) {
          await onPaymentSucceeded();
        }
        return;
      }

      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: "Card"
      });
      if (error) {
        Alert.alert("Card payment", error.message ?? "Payment failed");
        return;
      }
      if (paymentIntent?.status === PaymentIntent.Status.Succeeded) {
        await onPaymentSucceeded();
      } else if (paymentIntent?.status === PaymentIntent.Status.RequiresAction) {
        Alert.alert("Action required", "Complete authentication in the sheet that appeared.");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("stripe_not_configured")) {
        Alert.alert("Not configured", "Add STRIPE_SECRET_KEY to Convex.");
      } else if (msg.includes("unauthenticated")) {
        Alert.alert("Sign in required", "Log in to pay.");
      } else {
        Alert.alert("Payment error", msg);
      }
    } finally {
      setBusy(false);
    }
  }, [
    backend,
    method,
    cardComplete,
    appleOk,
    googleOk,
    createPaymentIntent,
    amountCents,
    description,
    decimalAmount,
    confirmPlatformPayPayment,
    confirmPayment,
    onPaymentSucceeded
  ]);

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

  return (
    <ScrollView contentContainerStyle={styles.scroll} style={styles.flex} keyboardShouldPersistTaps="handled">
      <Text style={styles.amount}>{amountLabel}</Text>
      <Text style={styles.caption}>Choose how you want to pay</Text>

      {Platform.OS === "ios" ? (
        <MethodCard
          icon="logo-apple"
          title="Apple Pay"
          subtitle={appleOk ? "Pay with Wallet" : "Not available on this device"}
          selected={method === "apple"}
          disabled={!appleOk}
          onPress={() => setMethod("apple")}
        />
      ) : null}

      {Platform.OS === "android" ? (
        <MethodCard
          icon="logo-google"
          title="Google Pay"
          subtitle={googleOk ? "Pay with Google Pay" : "Not available on this device"}
          selected={method === "google"}
          disabled={!googleOk}
          onPress={() => setMethod("google")}
        />
      ) : null}

      <MethodCard
        icon="card-outline"
        title="Debit or credit card"
        subtitle="Enter your card securely (Stripe)"
        selected={method === "card"}
        onPress={() => setMethod("card")}
      />

      {method === "card" ? (
        <AppCard style={styles.cardFieldWrap}>
          <Text style={styles.cardLabel}>Card</Text>
          <CardField
            postalCodeEnabled={true}
            placeholders={{ number: "4242 4242 4242 4242" }}
            cardStyle={{
              backgroundColor: colors.backgroundElevated,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              textColor: colors.textPrimary,
              placeholderColor: colors.textMuted
            }}
            style={styles.cardField}
            onCardChange={(details) => setCardComplete(details.complete)}
          />
        </AppCard>
      ) : null}

      <PrimaryButton title={busy ? "Processing…" : `Pay ${amountLabel}`} onPress={runPayment} loading={busy} />

      <Text style={styles.legal}>
        Payments are processed by Stripe. Card numbers never touch Study2Gather servers. Apple Pay and Google Pay use
        your saved wallet card.
      </Text>
    </ScrollView>
  );
}

function MethodCard({
  icon,
  title,
  subtitle,
  selected,
  disabled,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.methodCard,
        selected && styles.methodCardSelected,
        disabled && styles.methodCardDisabled,
        pressed && !disabled && styles.methodCardPressed
      ]}
    >
      <View style={styles.methodRow}>
        <Ionicons name={icon} size={28} color={disabled ? colors.textMuted : colors.primary} />
        <View style={styles.methodText}>
          <Text style={[styles.methodTitle, disabled && styles.methodTitleDisabled]}>{title}</Text>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
        {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: space.lg,
    paddingBottom: space.xl * 2,
    gap: space.md
  },
  centered: { justifyContent: "center", alignItems: "center", padding: space.lg },
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
  methodCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: space.md
  },
  methodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted
  },
  methodCardDisabled: { opacity: 0.45 },
  methodCardPressed: { opacity: 0.92 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  methodText: { flex: 1 },
  methodTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  methodTitleDisabled: { color: colors.textMuted },
  methodSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardFieldWrap: { marginTop: space.sm },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: space.sm
  },
  cardField: { width: "100%", height: 52 },
  legal: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: space.lg,
    textAlign: "center"
  }
});
