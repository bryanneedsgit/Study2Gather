import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Tier / gamification level for leaderboard UX */
const tierStatus = v.union(
  v.literal("bronze"),
  v.literal("silver"),
  v.literal("gold"),
  v.literal("platinum")
);

const studySessionStatus = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("failed")
);

const forumPostStatus = v.union(v.literal("open"), v.literal("resolved"));

const cafeSeatHoldStatus = v.union(
  v.literal("active"),
  v.literal("expired"),
  v.literal("converted"),
  v.literal("cancelled")
);

const reservationStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("cancelled"),
  v.literal("completed"),
  v.literal("no_show")
);

const couponPurchaseStatus = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("failed"),
  v.literal("redeemed"),
  v.literal("refunded")
);

const rewardRedemptionStatus = v.union(v.literal("completed"));

export default defineSchema({
  users: defineTable({
    /** Normalized lowercase email — unique identity for demo / email-first auth (upgrade to Convex Auth later). */
    email: v.string(),
    name: v.optional(v.string()),
    school: v.optional(v.string()),
    course: v.optional(v.string()),
    age: v.optional(v.number()),
    /** Set true after onboarding mutation succeeds. */
    onboarding_completed: v.boolean(),
    points_total: v.number(),
    tier_status: tierStatus,
    created_at: v.number(),
    /** Minutes east of UTC (e.g. 480 = UTC+8). Used for local night window (no points 00:00–06:00). */
    timezone_offset_minutes: v.optional(v.number()),
    /** When set and `Date.now() < cooldown_until`, user cannot start a new lock-in session. */
    cooldown_until: v.optional(v.number())
  })
    .index("by_email", ["email"])
    .index("by_school", ["school"])
    .index("by_school_and_course", ["school", "course"])
    .index("by_points", ["points_total"]),

  study_groups: defineTable({
    name: v.optional(v.string()),
    created_by: v.id("users"),
    created_at: v.number()
  }).index("by_created_by", ["created_by"]),

  study_group_members: defineTable({
    group_id: v.id("study_groups"),
    user_id: v.id("users"),
    joined_at: v.number()
  })
    .index("by_group", ["group_id"])
    .index("by_user", ["user_id"])
    .index("by_group_and_user", ["group_id", "user_id"]),

  study_sessions: defineTable({
    group_id: v.id("study_groups"),
    started_at: v.number(),
    ended_at: v.optional(v.number()),
    status: studySessionStatus,
    duration_minutes: v.number(),
    points_awarded: v.number(),
    ended_reason: v.optional(v.string())
  })
    .index("by_group", ["group_id"])
    .index("by_status", ["status"])
    .index("by_group_started", ["group_id", "started_at"])
    .index("by_group_status", ["group_id", "status"]),

  session_participants: defineTable({
    session_id: v.id("study_sessions"),
    user_id: v.id("users"),
    app_foreground_ok: v.boolean(),
    proximity_ok: v.boolean(),
    checked_in_at: v.optional(v.number()),
    last_seen_at: v.optional(v.number())
  })
    .index("by_session", ["session_id"])
    .index("by_user", ["user_id"])
    .index("by_session_and_user", ["session_id", "user_id"]),

  forum_posts: defineTable({
    author_id: v.id("users"),
    title: v.string(),
    body: v.string(),
    subject: v.string(),
    status: forumPostStatus,
    scheduled_meetup_time: v.optional(v.number()),
    created_at: v.number()
  })
    .index("by_author", ["author_id"])
    .index("by_subject", ["subject"])
    .index("by_status", ["status"])
    .index("by_created", ["created_at"]),

  study_spots: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    is_partner: v.boolean()
  })
    .index("by_type", ["type"])
    .index("by_partner", ["is_partner"]),

  cafe_locations: defineTable({
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    total_stipulated_tables: v.number(),
    current_occupied_tables: v.number(),
    footfall_metric: v.number(),
    reduce_margin: v.boolean()
  }).index("by_name", ["name"]),

  cafe_seat_holds: defineTable({
    cafe_id: v.id("cafe_locations"),
    user_id: v.id("users"),
    expires_at: v.number(),
    status: cafeSeatHoldStatus
  })
    .index("by_cafe", ["cafe_id"])
    .index("by_user", ["user_id"])
    .index("by_cafe_status", ["cafe_id", "status"])
    .index("by_expires", ["expires_at"]),

  reservations: defineTable({
    user_id: v.id("users"),
    cafe_id: v.id("cafe_locations"),
    session_id: v.optional(v.id("study_sessions")),
    seat_hold_id: v.optional(v.id("cafe_seat_holds")),
    coupon_purchase_id: v.optional(v.id("coupon_purchases")),
    start_time: v.number(),
    end_time: v.number(),
    status: reservationStatus,
    is_verified: v.boolean()
  })
    .index("by_user", ["user_id"])
    .index("by_cafe", ["cafe_id"])
    .index("by_cafe_start", ["cafe_id", "start_time"])
    .index("by_seat_hold", ["seat_hold_id"])
    .index("by_coupon_purchase", ["coupon_purchase_id"]),

  coupon_purchases: defineTable({
    user_id: v.id("users"),
    cafe_id: v.id("cafe_locations"),
    reservation_id: v.id("reservations"),
    amount_paid: v.number(),
    margin_reduced: v.boolean(),
    status: couponPurchaseStatus,
    purchased_at: v.number(),
    redeemed_at: v.optional(v.number()),
    pricing_mode: v.optional(
      v.union(v.literal("standard"), v.literal("competitive_rate"))
    ),
    tutor_user_id: v.optional(v.id("users"))
  })
    .index("by_user", ["user_id"])
    .index("by_cafe", ["cafe_id"])
    .index("by_reservation", ["reservation_id"])
    .index("by_status", ["status"]),

  /** Redeemable rewards (catalog). */
  reward_catalog: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    cost_points: v.number(),
    active: v.boolean(),
    created_at: v.number(),
    sort_order: v.optional(v.number())
  }).index("by_active", ["active"]),

  /** Successful reward redemptions (audit). */
  reward_redemptions: defineTable({
    user_id: v.id("users"),
    reward_id: v.id("reward_catalog"),
    points_spent: v.number(),
    status: rewardRedemptionStatus,
    created_at: v.number()
  })
    .index("by_user", ["user_id"])
    .index("by_reward", ["reward_id"])
    .index("by_user_created", ["user_id", "created_at"]),

  /**
   * Append-only ledger for point changes made through `rewards:addPoints` / `rewards:deductPoints` / `rewards:redeemReward`.
   * Lock-in and cafe flows may still update `users.points_total` directly until migrated to call these mutations.
   */
  points_ledger: defineTable({
    user_id: v.id("users"),
    delta: v.number(),
    reason: v.optional(v.string()),
    balance_after: v.number(),
    created_at: v.number()
  })
    .index("by_user", ["user_id"])
    .index("by_user_created", ["user_id", "created_at"])
});
