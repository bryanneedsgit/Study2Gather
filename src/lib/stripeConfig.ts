/**
 * Client-side Stripe / wallet defaults (override via Expo env when needed).
 */
export const STRIPE_MERCHANT_COUNTRY =
  process.env.EXPO_PUBLIC_STRIPE_MERCHANT_COUNTRY ?? "IE";

export const STRIPE_CURRENCY = (process.env.EXPO_PUBLIC_STRIPE_CURRENCY ?? "eur").toLowerCase();

export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const STRIPE_MERCHANT_IDENTIFIER =
  process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER ?? "merchant.com.study2gather";
