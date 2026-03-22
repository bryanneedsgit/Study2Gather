/**
 * Generic add/delete mutations per table (admin / dev tooling).
 * DB writes use mutations only — Convex Actions are for external side effects, not direct `db` access.
 */
import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import {
  cafeSeatHoldStatus,
  couponPurchaseStatus,
  forumPostStatus,
  pricingMode,
  reservationStatus,
  studySessionStatus,
  tierStatus
} from "./validators";

/* -------------------------------------------------------------------------- */
/* users                                                                      */
/* -------------------------------------------------------------------------- */

export const addUser = mutationGeneric({
  args: {
    email: v.string(),
    username: v.optional(v.string()),
    school: v.optional(v.string()),
    course: v.optional(v.string()),
    age: v.optional(v.number()),
    onboarding_completed: v.optional(v.boolean()),
    points: v.optional(v.number()),
    tier_status: v.optional(tierStatus),
    timezone_offset_minutes: v.optional(v.number()),
    cooldown_until: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("users", {
      email: args.email.trim().toLowerCase(),
      username: args.username,
      school: args.school,
      course: args.course,
      age: args.age,
      onboarding_completed: args.onboarding_completed ?? false,
      points: args.points ?? 0,
      tier_status: args.tier_status ?? "bronze",
      created_at: now,
      timezone_offset_minutes: args.timezone_offset_minutes,
      cooldown_until: args.cooldown_until
    });
  }
});

export const deleteUser = mutationGeneric({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* study_groups                                                               */
/* -------------------------------------------------------------------------- */

export const addStudyGroup = mutationGeneric({
  args: {
    created_by: v.id("users"),
    name: v.optional(v.string()),
    created_at: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("study_groups", {
      created_by: args.created_by,
      name: args.name,
      created_at: args.created_at ?? Date.now()
    });
  }
});

export const deleteStudyGroup = mutationGeneric({
  args: { id: v.id("study_groups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* study_group_members                                                        */
/* -------------------------------------------------------------------------- */

export const addStudyGroupMember = mutationGeneric({
  args: {
    group_id: v.id("study_groups"),
    user_id: v.id("users"),
    joined_at: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("study_group_members", {
      group_id: args.group_id,
      user_id: args.user_id,
      joined_at: args.joined_at ?? Date.now()
    });
  }
});

export const deleteStudyGroupMember = mutationGeneric({
  args: { id: v.id("study_group_members") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* study_sessions                                                             */
/* -------------------------------------------------------------------------- */

export const addStudySession = mutationGeneric({
  args: {
    group_id: v.id("study_groups"),
    started_at: v.number(),
    ended_at: v.optional(v.number()),
    status: studySessionStatus,
    duration_minutes: v.number(),
    points_awarded: v.number(),
    ended_reason: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("study_sessions", {
      group_id: args.group_id,
      started_at: args.started_at,
      ended_at: args.ended_at,
      status: args.status,
      duration_minutes: args.duration_minutes,
      points_awarded: args.points_awarded,
      ended_reason: args.ended_reason
    });
  }
});

export const deleteStudySession = mutationGeneric({
  args: { id: v.id("study_sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* session_participants                                                       */
/* -------------------------------------------------------------------------- */

export const addSessionParticipant = mutationGeneric({
  args: {
    session_id: v.id("study_sessions"),
    user_id: v.id("users"),
    app_foreground_ok: v.boolean(),
    proximity_ok: v.boolean(),
    checked_in_at: v.optional(v.number()),
    last_seen_at: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("session_participants", {
      session_id: args.session_id,
      user_id: args.user_id,
      app_foreground_ok: args.app_foreground_ok,
      proximity_ok: args.proximity_ok,
      checked_in_at: args.checked_in_at,
      last_seen_at: args.last_seen_at
    });
  }
});

export const deleteSessionParticipant = mutationGeneric({
  args: { id: v.id("session_participants") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* forum_posts                                                                */
/* -------------------------------------------------------------------------- */

export const addForumPost = mutationGeneric({
  args: {
    author_id: v.id("users"),
    title: v.string(),
    body: v.string(),
    subject: v.string(),
    status: forumPostStatus,
    scheduled_meetup_time: v.optional(v.number()),
    created_at: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("forum_posts", {
      author_id: args.author_id,
      title: args.title,
      body: args.body,
      subject: args.subject,
      status: args.status,
      scheduled_meetup_time: args.scheduled_meetup_time,
      created_at: args.created_at ?? Date.now()
    });
  }
});

export const deleteForumPost = mutationGeneric({
  args: { id: v.id("forum_posts") },
  handler: async (ctx, args) => {
    const responses = await ctx.db
      .query("forum_responses")
      .withIndex("by_post", (q) => q.eq("post_id", args.id))
      .collect();
    for (const r of responses) {
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* forum_responses                                                            */
/* -------------------------------------------------------------------------- */

export const addForumResponse = mutationGeneric({
  args: {
    post_id: v.id("forum_posts"),
    author_id: v.id("users"),
    body: v.string(),
    created_at: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("forum_responses", {
      post_id: args.post_id,
      author_id: args.author_id,
      body: args.body,
      created_at: args.created_at ?? Date.now()
    });
  }
});

export const deleteForumResponse = mutationGeneric({
  args: { id: v.id("forum_responses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* study_spots                                                                */
/* -------------------------------------------------------------------------- */

export const addStudySpot = mutationGeneric({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    type: v.string(),
    is_partner: v.boolean()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("study_spots", {
      name: args.name,
      description: args.description,
      lat: args.lat,
      lng: args.lng,
      type: args.type,
      is_partner: args.is_partner
    });
  }
});

export const deleteStudySpot = mutationGeneric({
  args: { id: v.id("study_spots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* cafe_locations                                                             */
/* -------------------------------------------------------------------------- */

export const addCafeLocation = mutationGeneric({
  args: {
    name: v.string(),
    lat: v.number(),
    lng: v.number(),
    total_stipulated_tables: v.number(),
    current_occupied_tables: v.number(),
    footfall_metric: v.number(),
    reduce_margin: v.boolean(),
    timezone_offset_minutes: v.optional(v.number()),
    opens_local_minute: v.optional(v.number()),
    closes_local_minute: v.optional(v.number()),
    opening_hours_osm_raw: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cafe_locations", {
      name: args.name,
      lat: args.lat,
      lng: args.lng,
      total_stipulated_tables: args.total_stipulated_tables,
      current_occupied_tables: args.current_occupied_tables,
      footfall_metric: args.footfall_metric,
      reduce_margin: args.reduce_margin,
      timezone_offset_minutes: args.timezone_offset_minutes,
      opens_local_minute: args.opens_local_minute,
      closes_local_minute: args.closes_local_minute,
      opening_hours_osm_raw: args.opening_hours_osm_raw
    });
  }
});

export const deleteCafeLocation = mutationGeneric({
  args: { id: v.id("cafe_locations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* cafe_seat_holds                                                            */
/* -------------------------------------------------------------------------- */

export const addCafeSeatHold = mutationGeneric({
  args: {
    cafe_id: v.id("cafe_locations"),
    user_id: v.id("users"),
    expires_at: v.number(),
    status: cafeSeatHoldStatus
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cafe_seat_holds", {
      cafe_id: args.cafe_id,
      user_id: args.user_id,
      expires_at: args.expires_at,
      status: args.status
    });
  }
});

export const deleteCafeSeatHold = mutationGeneric({
  args: { id: v.id("cafe_seat_holds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* reservations                                                               */
/* -------------------------------------------------------------------------- */

export const addReservation = mutationGeneric({
  args: {
    user_id: v.id("users"),
    cafe_id: v.id("cafe_locations"),
    session_id: v.optional(v.id("study_sessions")),
    seat_hold_id: v.optional(v.id("cafe_seat_holds")),
    coupon_purchase_id: v.optional(v.id("coupon_purchases")),
    start_time: v.number(),
    end_time: v.number(),
    duration_hours: v.optional(v.number()),
    cost: v.optional(v.number()),
    pricing_booking_now_ms: v.optional(v.number()),
    status: reservationStatus,
    is_verified: v.boolean()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reservations", {
      user_id: args.user_id,
      cafe_id: args.cafe_id,
      session_id: args.session_id,
      seat_hold_id: args.seat_hold_id,
      coupon_purchase_id: args.coupon_purchase_id,
      start_time: args.start_time,
      end_time: args.end_time,
      duration_hours: args.duration_hours,
      cost: args.cost,
      pricing_booking_now_ms: args.pricing_booking_now_ms,
      status: args.status,
      is_verified: args.is_verified
    });
  }
});

export const deleteReservation = mutationGeneric({
  args: { id: v.id("reservations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

/* -------------------------------------------------------------------------- */
/* coupon_purchases                                                           */
/* -------------------------------------------------------------------------- */

export const addCouponPurchase = mutationGeneric({
  args: {
    user_id: v.id("users"),
    cafe_id: v.id("cafe_locations"),
    reservation_id: v.id("reservations"),
    amount_paid: v.number(),
    margin_reduced: v.boolean(),
    status: couponPurchaseStatus,
    purchased_at: v.optional(v.number()),
    redeemed_at: v.optional(v.number()),
    pricing_mode: v.optional(pricingMode),
    tutor_user_id: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("coupon_purchases", {
      user_id: args.user_id,
      cafe_id: args.cafe_id,
      reservation_id: args.reservation_id,
      amount_paid: args.amount_paid,
      margin_reduced: args.margin_reduced,
      status: args.status,
      purchased_at: args.purchased_at ?? Date.now(),
      redeemed_at: args.redeemed_at,
      pricing_mode: args.pricing_mode,
      tutor_user_id: args.tutor_user_id
    });
  }
});

export const deleteCouponPurchase = mutationGeneric({
  args: { id: v.id("coupon_purchases") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});
