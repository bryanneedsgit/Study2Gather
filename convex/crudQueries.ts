/**
 * Generic get + list queries per table (pair with `crudMutations.ts`).
 */
import { queryGeneric } from "convex/server";
import { v } from "convex/values";

const listArgs = {
  limit: v.optional(v.number())
};

function capLimit(limit: number | undefined) {
  return Math.min(Math.max(limit ?? 100, 1), 500);
}

/* users */
export const getUser = queryGeneric({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listUsers = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("users").take(capLimit(args.limit));
  }
});

/* study_groups */
export const getStudyGroup = queryGeneric({
  args: { id: v.id("study_groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listStudyGroups = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("study_groups").take(capLimit(args.limit));
  }
});

/* study_group_members */
export const getStudyGroupMember = queryGeneric({
  args: { id: v.id("study_group_members") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listStudyGroupMembers = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("study_group_members").take(capLimit(args.limit));
  }
});

/* study_sessions */
export const getStudySession = queryGeneric({
  args: { id: v.id("study_sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listStudySessions = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("study_sessions").take(capLimit(args.limit));
  }
});

/* session_participants */
export const getSessionParticipant = queryGeneric({
  args: { id: v.id("session_participants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listSessionParticipants = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("session_participants").take(capLimit(args.limit));
  }
});

/* forum_posts */
export const getForumPost = queryGeneric({
  args: { id: v.id("forum_posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listForumPosts = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("forum_posts").take(capLimit(args.limit));
  }
});

/* study_spots */
export const getStudySpot = queryGeneric({
  args: { id: v.id("study_spots") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listStudySpots = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("study_spots").take(capLimit(args.limit));
  }
});

/* cafe_locations */
export const getCafeLocation = queryGeneric({
  args: { id: v.id("cafe_locations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listCafeLocations = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("cafe_locations").take(capLimit(args.limit));
  }
});

/* cafe_seat_holds */
export const getCafeSeatHold = queryGeneric({
  args: { id: v.id("cafe_seat_holds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listCafeSeatHolds = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("cafe_seat_holds").take(capLimit(args.limit));
  }
});

/* reservations */
export const getReservation = queryGeneric({
  args: { id: v.id("reservations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listReservations = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("reservations").take(capLimit(args.limit));
  }
});

/* coupon_purchases */
export const getCouponPurchase = queryGeneric({
  args: { id: v.id("coupon_purchases") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  }
});

export const listCouponPurchases = queryGeneric({
  args: listArgs,
  handler: async (ctx, args) => {
    return await ctx.db.query("coupon_purchases").take(capLimit(args.limit));
  }
});
