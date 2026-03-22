/**
 * Dev/test data seeding. Run from the Convex dashboard or CLI, e.g.:
 *   npx convex run seed:seedCafeLocations
 *   npx convex run seed:seedN8nFeedData
 */
import { mutationGeneric } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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

/** Schools/courses for variety in n8n match data */
const N8N_SEED_SCHOOLS = ["NUS", "NTU", "SMU", "SUTD", "SUSS"] as const;
const N8N_SEED_COURSES = ["CS", "EE", "Business", "Design", "Psychology"] as const;

/**
 * Seed 20 users and lock_in_sessions for n8n to consume via GET /get_n8n_data.
 * Run: npx convex run seed:seedN8nFeedData
 */
export const seedN8nFeedData = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const cafes = await ctx.db.query("cafe_locations").take(4);
    const studySpots = await ctx.db.query("study_spots").take(2);
    const allLocations: string[] = [
      ...cafes.map((c) => c._id as string),
      ...studySpots.map((s) => s._id as string)
    ].filter(Boolean);

    const userIds: Id<"users">[] = [];
    const existingUsers = await ctx.db.query("users").take(50);
    if (existingUsers.length >= 20) {
      userIds.push(...existingUsers.slice(0, 20).map((u) => u._id));
    } else {
      for (let i = 0; i < 20; i++) {
        const email = `seed_n8n_${i + 1}@test.com`;
        const existing = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email))
          .first();
        if (existing) {
          userIds.push(existing._id);
        } else {
          const id = await ctx.db.insert("users", {
            email,
            name: `N8N Seed User ${i + 1}`,
            school: N8N_SEED_SCHOOLS[i % N8N_SEED_SCHOOLS.length],
            course: N8N_SEED_COURSES[i % N8N_SEED_COURSES.length],
            age: 18 + (i % 10),
            onboarding_completed: true,
            points: 50 + i * 10,
            tier_status: (["bronze", "silver", "gold"] as const)[i % 3],
            created_at: now - (i + 1) * oneDayMs
          });
          userIds.push(id);
        }
      }
    }

    let sessionsCreated = 0;
    for (let u = 0; u < userIds.length; u++) {
      const numSessions = 2 + (u % 4);
      for (let s = 0; s < numSessions; s++) {
        const daysAgo = (u * 3 + s * 2) % 14;
        const startMs = now - daysAgo * oneDayMs - (s % 24) * 60 * 60 * 1000;
        const durationMins = 15 + (u + s) % 90;
        const endMs = startMs + durationMins * 60 * 1000;
        await ctx.db.insert("lock_in_sessions", {
          user_id: userIds[u],
          ...(allLocations.length > 0
            ? { location_id: allLocations[(u + s) % allLocations.length] }
            : {}),
          started_at: startMs,
          ended_at: endMs,
          status: "completed",
          duration_minutes: durationMins,
          points_awarded: Math.floor(durationMins * 0.5) + (u % 5),
          timezone_offset_minutes: 480
        });
        sessionsCreated++;
      }
    }

    return {
      usersCount: userIds.length,
      sessionsCreated,
      userIds: userIds.map((id) => id as string)
    };
  }
});
