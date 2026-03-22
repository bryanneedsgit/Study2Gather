import type { ReactElement } from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { STRIPE_MERCHANT_IDENTIFIER, STRIPE_PUBLISHABLE_KEY } from "@/lib/stripeConfig";

/** iOS / Android: wrap with Stripe when a publishable key is set. */
export function StripeOptionalProvider({
  children
}: {
  children: ReactElement | ReactElement[];
}) {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return <>{children}</>;
  }
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier={STRIPE_MERCHANT_IDENTIFIER}
    >
      {children}
    </StripeProvider>
  );
}
