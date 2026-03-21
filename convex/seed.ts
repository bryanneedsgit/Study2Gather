/**
 * Dev/test data seeding. Run from the Convex dashboard or CLI, e.g.:
 *   npx convex run seed:seedCafeLocations
 */
import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

const TEST_CAFE_LOCATIONS = [
  {
    name: "Study2Gather Test Café — Orchard",
    lat: 1.3048,
    lng: 103.832,
    total_stipulated_tables: 24,
    current_occupied_tables: 6,
    footfall_metric: 120,
    reduce_margin: false
  },
  {
    name: "Study2Gather Test Café — Kent Ridge",
    lat: 1.2966,
    lng: 103.7764,
    total_stipulated_tables: 18,
    current_occupied_tables: 4,
    footfall_metric: 85,
    reduce_margin: true
  },
  {
    name: "Study2Gather Test Café — Jurong East",
    lat: 1.3332,
    lng: 103.7423,
    total_stipulated_tables: 32,
    current_occupied_tables: 10,
    footfall_metric: 200,
    reduce_margin: false
  },
  {
    name: "Quiet Bean (Test Partner)",
    lat: 1.3521,
    lng: 103.8198,
    total_stipulated_tables: 12,
    current_occupied_tables: 2,
    footfall_metric: 45,
    reduce_margin: true
  }
] as const;

export const seedCafeLocations = mutationGeneric({
  args: {
    /** If true, insert every row even when the same name already exists (can create duplicates). */
    forceDuplicateNames: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const inserted: string[] = [];
    const skipped: string[] = [];

    for (const row of TEST_CAFE_LOCATIONS) {
      if (!args.forceDuplicateNames) {
        const existing = await ctx.db
          .query("cafe_locations")
          .withIndex("by_name", (q) => q.eq("name", row.name))
          .first();
        if (existing) {
          skipped.push(row.name);
          continue;
        }
      }
      const id = await ctx.db.insert("cafe_locations", { ...row });
      inserted.push(id);
    }

    return {
      insertedCount: inserted.length,
      insertedIds: inserted,
      skippedExistingNames: skipped
    };
  }
});
