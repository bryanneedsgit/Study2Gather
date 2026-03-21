/**
 * Lock-in reservations: gate check-in and lock-in by venue + time window.
 */
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";

type DbCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/** Returns a valid reservation if user has one for this location and current time is within [start_time, end_time]. */
export async function getValidReservation(
  ctx: DbCtx,
  userId: string,
  locationId: string,
  nowMs: number
) {
  const rows = await ctx.db
    .query("lock_in_reservations")
    .withIndex("by_user_location", (q) =>
      q.eq("user_id", userId as Id<"users">).eq("location_id", locationId)
    )
    .collect();
  for (const r of rows) {
    if (r.start_time <= nowMs && nowMs <= r.end_time) {
      if (r.status !== "used" && r.status !== "expired") return r;
    }
  }
  return null;
}

/** Create a reservation (for admin / n8n). */
export const createLockInReservation = mutationGeneric({
  args: {
    userId: v.id("users"),
    locationId: v.string(),
    startTime: v.number(),
    endTime: v.number()
  },
  handler: async (ctx, args) => {
    const duration = Math.floor((args.endTime - args.startTime) / 60000);
    return await ctx.db.insert("lock_in_reservations", {
      user_id: args.userId,
      location_id: args.locationId,
      start_time: args.startTime,
      end_time: args.endTime,
      duration,
      status: "active"
    });
  }
});
