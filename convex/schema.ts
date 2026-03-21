import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
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

const lockInSessionStatus = v.union(
  v.literal("active"),
  v.literal("completed"),
  v.literal("cancelled")
);

/** QR + GPS check-in that gates solo lock-in until consumed or TTL. */
const locationCheckInStatus = v.union(
  v.literal("active"),
  v.literal("consumed"),
  v.literal("expired")
);

const rewardRedemptionStatus = v.union(v.literal("completed"));

export default defineSchema({
  ...authTables,
  /**
   * Convex Auth `users` extended with Study2Gather fields.
   * Defaults for app fields are applied in `auth.ts` `afterUserCreatedOrUpdated`.
   */
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    school: v.optional(v.string()),
    course: v.optional(v.string()),
    age: v.optional(v.number()),
    onboarding_completed: v.optional(v.boolean()),
    points: v.optional(v.number()),
    /** Legacy name; prefer `points` for new writes. */
    points_total: v.optional(v.number()),
    tier_status: v.optional(tierStatus),
    created_at: v.optional(v.number()),
    timezone_offset_minutes: v.optional(v.number()),
    cooldown_until: v.optional(v.number())
  })
    .index("email", ["email"])
    .index("by_school", ["school"])
    .index("by_school_and_course", ["school", "course"])
    .index("by_points", ["points"]),

  /**
   * Solo “locked in” focus sessions (one user). Group lock-in still uses `study_sessions`.
   */
  lock_in_sessions: defineTable({
    user_id: v.id("users"),
    started_at: v.number(),
    ended_at: v.optional(v.number()),
    status: lockInSessionStatus,
    duration_minutes: v.number(),
    points_awarded: v.number(),
    timezone_offset_minutes: v.number()
  })
    .index("by_user", ["user_id"])
    .index("by_user_status", ["user_id", "status"]),

  /**
   * User completed QR scan + server location validation at a study spot or cafe.
   * Required before `startSoloLockIn`; consumed when lock-in starts (or expires by TTL).
   */
  lock_in_location_check_ins: defineTable({
    user_id: v.id("users"),
    study_spot_id: v.optional(v.id("study_spots")),
    cafe_id: v.optional(v.id("cafe_locations")),
    verified_at: v.number(),
    expires_at: v.number(),
    status: locationCheckInStatus
  })
    .index("by_user", ["user_id"]),

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
    .index("by_group_status", ["group_id", "status"])
    /** Range queries for monthly leaderboard (completed sessions with ended_at). */
    .index("by_ended_at", ["ended_at"]),

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

  /** Text replies on forum threads (no nesting / likes in MVP). */
  forum_responses: defineTable({
    post_id: v.id("forum_posts"),
    author_id: v.id("users"),
    body: v.string(),
    created_at: v.number()
  })
    .index("by_post", ["post_id"])
    .index("by_author", ["author_id"])
    .index("by_post_created", ["post_id", "created_at"]),

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

  /** Partner café menu lines (shown in-app only after check-in + reservation match). */
  cafe_menu_items: defineTable({
    cafe_id: v.id("cafe_locations"),
    name: v.string(),
    description: v.optional(v.string()),
    /** Legacy single price; used when original/s2g not set. */
    price_cents: v.optional(v.number()),
    /** List price at the café counter. */
    cafe_original_price_cents: v.optional(v.number()),
    /** Study2Gather partner rate before coupon. */
    s2g_special_price_cents: v.optional(v.number()),
    /** Cents off when the user applies an eligible coupon at checkout. */
    coupon_discount_cents: v.optional(v.number()),
    category: v.optional(v.string()),
    sort_order: v.number()
  }).index("by_cafe", ["cafe_id"]),

  /** Optional audit rows for menu-tab / check-in flows (legacy). */
  menu_tab_test_runs: defineTable({
    user_id: v.id("users"),
    cafe_id: v.id("cafe_locations"),
    reservation_id: v.optional(v.id("reservations")),
    check_in_id: v.id("lock_in_location_check_ins"),
    created_at: v.number()
  })
    .index("by_user", ["user_id"])
    .index("by_cafe", ["cafe_id"]),

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
   * Lock-in and cafe flows may still update `users.points` directly until migrated to call these mutations.
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
