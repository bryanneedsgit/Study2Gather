import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PrimaryButton } from "@/components/PrimaryButton";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

type Props = {
  amountLabel: string;
  onPaid: () => void | Promise<void>;
};

/**
 * Web-only: Stripe Payment Element (cards, Link, wallets when enabled in Stripe Dashboard).
 */
export function WebStripePaymentForm({ amountLabel, onPaid }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    try {
      const returnUrl =
        typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : "";
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl
        },
        redirect: "if_required"
      });

      if (error) {
        setErr(error.message ?? "Payment failed");
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        await Promise.resolve(onPaid());
      }
    } finally {
      setBusy(false);
    }
  };

  const ready = Boolean(stripe && elements);

  return (
    <View style={styles.wrap}>
      {/* Stripe injects DOM (iframes); parent is a div on react-native-web. */}
      <View style={styles.elementShell}>
        <PaymentElement options={{ layout: "tabs" }} />
      </View>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <PrimaryButton
        title={busy ? "Processing…" : `Pay ${amountLabel}`}
        onPress={pay}
        disabled={!ready}
        loading={busy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  elementShell: {
    minHeight: 120,
    marginBottom: space.sm
  },
  err: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: space.sm
  }
});
