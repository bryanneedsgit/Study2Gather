import type { ReactElement } from "react";

/**
 * Web: do not load `@stripe/stripe-react-native` (native-only); importing it breaks the web bundle.
 */
export function StripeOptionalProvider({
  children
}: {
  children: ReactElement | ReactElement[];
}) {
  return <>{children}</>;
}
