import { action, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Whether Convex can create PaymentIntents (requires `STRIPE_SECRET_KEY` in deployment env).
 */
export const paymentsBackendReady = query({
  args: {},
  handler: async () => ({
    ready: Boolean(process.env.STRIPE_SECRET_KEY)
  })
});

/**
 * Creates a Stripe PaymentIntent for the signed-in user.
 * Set `STRIPE_SECRET_KEY` in the Convex dashboard (same deployment as the app).
 */
export const createPaymentIntent = action({
  args: {
    amountCents: v.number(),
    currency: v.optional(v.string()),
    description: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("unauthenticated");
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      throw new Error("stripe_not_configured");
    }

    if (!Number.isFinite(args.amountCents) || args.amountCents < 50 || args.amountCents > 99999999) {
      throw new Error("invalid_amount");
    }

    const currency = (args.currency ?? "eur").toLowerCase();

    const body = new URLSearchParams();
    body.set("amount", String(Math.round(args.amountCents)));
    body.set("currency", currency);
    body.set("automatic_payment_methods[enabled]", "true");
    body.set("metadata[convex_subject]", identity.subject);
    if (identity.email) {
      body.set("metadata[email]", identity.email);
    }
    if (args.description) {
      body.set("description", args.description.slice(0, 500));
    }

    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Stripe payment_intents error", res.status, text);
      throw new Error("stripe_error");
    }

    const data = (await res.json()) as { client_secret: string; id: string };
    return {
      paymentIntentId: data.id,
      clientSecret: data.client_secret
    };
  }
});
