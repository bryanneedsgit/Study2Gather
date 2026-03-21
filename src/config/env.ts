const required = {
  convexUrl: process.env.EXPO_PUBLIC_CONVEX_URL
} as const;

const missing = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  // Keep startup resilient in hackathon mode while still making misconfig obvious.
  console.warn(`Missing environment variables: ${missing.join(", ")}`);
}

export const env = {
  convexUrl: required.convexUrl ?? ""
} as const;
