import { internalMutationGeneric } from "convex/server";
import { v } from "convex/values";

export const applyOsmHoursPatch = internalMutationGeneric({
  args: {
    cafeId: v.id("cafe_locations"),
    opens_local_minute: v.number(),
    closes_local_minute: v.number(),
    opening_hours_osm_raw: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cafeId, {
      opens_local_minute: args.opens_local_minute,
      closes_local_minute: args.closes_local_minute,
      opening_hours_osm_raw: args.opening_hours_osm_raw
    });
  }
});
