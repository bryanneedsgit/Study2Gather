/**
 * Convex Auth.js config (used by Convex for JWT validation).
 * Set CONVEX_SITE_URL / SITE_URL in the Convex dashboard to match your app origin (e.g. Expo web URL).
 */
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex"
    }
  ]
};
