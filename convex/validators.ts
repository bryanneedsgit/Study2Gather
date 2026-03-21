import { v } from "convex/values";

/** Mirrors `convex/schema.ts` — reuse for CRUD args validation. */
export const tierStatus = v.union(
  v.literal("bronze"),
  v.literal("silver"),
  v.literal("gold"),
  v.literal("platinum")
);

export const studySessionStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("failed")
);

export const forumPostStatus = v.union(
  v.literal("open"),
  v.literal("resolved")
);

export const cafeSeatHoldStatus = v.union(
  v.literal("active"),
  v.literal("expired"),
  v.literal("converted"),
  v.literal("cancelled")
);

export const reservationStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("completed"),
  v.literal("no_show")
);

export const couponPurchaseStatus = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("redeemed"),
  v.literal("refunded")
);

export const pricingMode = v.union(
  v.literal("standard"),
  v.literal("competitive_rate")
);
