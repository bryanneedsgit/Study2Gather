# Payments (Stripe)

The app includes a **Payment** screen where users can pay with **Apple Pay** (iOS), **Google Pay** (Android), or a **card** using Stripe’s native UI (`CardField`).

## Café reservations (Study Spots)

When **`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`** is set and Convex has **`STRIPE_SECRET_KEY`** (`payments.paymentsBackendReady`), confirming a reservation uses **Pay & reserve**: the modal closes and the **Payment** screen opens for the quoted total. After Stripe succeeds, the app calls **`createTimeBasedReservation`** with the same slot.

If Stripe is **not** configured, the button stays **Confirm** and the reservation is created **without** payment (same as before).

## Environment variables

### Expo (client)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_…` / `pk_live_…`). Required for native payments. |
| `EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER` | Apple Pay merchant ID (default `merchant.com.study2gather`). Must match your Apple Developer / Xcode capability. |
| `EXPO_PUBLIC_STRIPE_MERCHANT_COUNTRY` | ISO country (default `IE`). |
| `EXPO_PUBLIC_STRIPE_CURRENCY` | ISO currency (default `eur`). |

### Convex (server)

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Secret key (`sk_test_…` / `sk_live_…`). Used by `convex/payments.ts` to create PaymentIntents. |

Set Convex vars in the [Convex dashboard](https://dashboard.convex.dev) for your deployment.

## Native build

`@stripe/stripe-react-native` uses native code. Use a **development build** or `expo run:ios` / `expo run:android` after `npx expo prebuild` if needed—not all flows work in Expo Go.

## Web

The **web** app uses **Stripe Payment Element** (`@stripe/stripe-js` + `@stripe/react-stripe-js`) in `PaymentScreen.web.tsx` — same Convex `createPaymentIntent` + `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` as native. After setting env vars, restart `npm run web`.

Wallets on web (Apple Pay / Google Pay) appear when enabled for your domain in the **Stripe Dashboard** and the browser supports them.

**Important:** `@stripe/stripe-react-native` must not be imported on web (it will break the bundle / white screen). This project uses `StripeOptionalProvider.web.tsx` so the web bundle never loads the native Stripe module.

## PCI

Card data is entered in Stripe’s `CardField` and tokenized by Stripe. Do not log full card numbers or send them to your own backend.
