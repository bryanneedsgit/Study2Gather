/**
 * Dev/test data seeding. Run from the Convex dashboard or CLI, e.g.:
 *   npx convex run seed:seedCafeLocations
 */
import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/** Partner cafés for map / booking demos (~15 rows, SG-area coords). */
const TEST_CAFE_LOCATIONS = [
  {
    name: "Orchard",
    lat: 1.3048,
    lng: 103.832,
    total_stipulated_tables: 24,
    current_occupied_tables: 6,
    footfall_metric: 120,
    reduce_margin: false
  },
  {
    name: "Kent Ridge",
    lat: 1.2966,
    lng: 103.7764,
    total_stipulated_tables: 18,
    current_occupied_tables: 4,
    footfall_metric: 85,
    reduce_margin: true
  },
  {
    name: "Jurong East",
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
  },
  {
    name: "Marina Focus Lounge",
    lat: 1.283,
    lng: 103.851,
    total_stipulated_tables: 40,
    current_occupied_tables: 14,
    footfall_metric: 210,
    reduce_margin: false
  },
  {
    name: "Bugis Brew & Books",
    lat: 1.2985,
    lng: 103.8558,
    total_stipulated_tables: 22,
    current_occupied_tables: 7,
    footfall_metric: 155,
    reduce_margin: false
  },
  {
    name: "Holland Village Quiet Cup",
    lat: 1.3112,
    lng: 103.7956,
    total_stipulated_tables: 16,
    current_occupied_tables: 5,
    footfall_metric: 72,
    reduce_margin: true
  },
  {
    name: "Tampines Study Hub Café",
    lat: 1.3526,
    lng: 103.9448,
    total_stipulated_tables: 28,
    current_occupied_tables: 9,
    footfall_metric: 168,
    reduce_margin: false
  },
  {
    name: "Serangoon Night Owl Roasters",
    lat: 1.3498,
    lng: 103.8738,
    total_stipulated_tables: 20,
    current_occupied_tables: 6,
    footfall_metric: 98,
    reduce_margin: true
  },
  {
    name: "Clementi Campus Corner",
    lat: 1.315,
    lng: 103.7652,
    total_stipulated_tables: 26,
    current_occupied_tables: 8,
    footfall_metric: 132,
    reduce_margin: false
  },
  {
    name: "Bishan Brain Fuel",
    lat: 1.3506,
    lng: 103.8484,
    total_stipulated_tables: 18,
    current_occupied_tables: 4,
    footfall_metric: 88,
    reduce_margin: true
  },
  {
    name: "Punggol Waterside Study Spot",
    lat: 1.405,
    lng: 103.902,
    total_stipulated_tables: 24,
    current_occupied_tables: 7,
    footfall_metric: 112,
    reduce_margin: false
  },
  {
    name: "Woodlands North Bean Lab",
    lat: 1.428,
    lng: 103.786,
    total_stipulated_tables: 14,
    current_occupied_tables: 3,
    footfall_metric: 52,
    reduce_margin: true
  },
  {
    name: "Changi Airport T3 Focus Bar",
    lat: 1.3547,
    lng: 103.9886,
    total_stipulated_tables: 36,
    current_occupied_tables: 18,
    footfall_metric: 240,
    reduce_margin: false
  },
  {
    name: "Dhoby Ghaut Underground Grind",
    lat: 1.299,
    lng: 103.845,
    total_stipulated_tables: 30,
    current_occupied_tables: 11,
    footfall_metric: 178,
    reduce_margin: false
  }
] as const;

/** Partner cafés (~49.14°N, 9.21°E) for EU demos. */
const HEILBRONN_PARTNER_CAFES = [
  {
    name: "Marktplatz Lernlounge",
    lat: 49.1431,
    lng: 9.2188,
    total_stipulated_tables: 20,
    current_occupied_tables: 5,
    footfall_metric: 95,
    reduce_margin: false
  },
  {
    name: "Neckar Ufer Focus Café",
    lat: 49.1389,
    lng: 9.2242,
    total_stipulated_tables: 16,
    current_occupied_tables: 4,
    footfall_metric: 72,
    reduce_margin: true
  },
  {
    name: "Rathaus Quartier Beans",
    lat: 49.1415,
    lng: 9.2134,
    total_stipulated_tables: 24,
    current_occupied_tables: 8,
    footfall_metric: 110,
    reduce_margin: false
  },
  {
    name: "Kilianskirche Study Corner",
    lat: 49.1442,
    lng: 9.2201,
    total_stipulated_tables: 12,
    current_occupied_tables: 2,
    footfall_metric: 48,
    reduce_margin: true
  },
  {
    name: "Experimenta Café Lab",
    lat: 49.1356,
    lng: 9.2078,
    total_stipulated_tables: 28,
    current_occupied_tables: 9,
    footfall_metric: 140,
    reduce_margin: false
  },
  {
    name: "Böckingen Campus Brew",
    lat: 49.1284,
    lng: 9.1956,
    total_stipulated_tables: 22,
    current_occupied_tables: 6,
    footfall_metric: 88,
    reduce_margin: false
  },
  {
    name: "Sontheim Hochschule Spot",
    lat: 49.1247,
    lng: 9.1889,
    total_stipulated_tables: 30,
    current_occupied_tables: 12,
    footfall_metric: 155,
    reduce_margin: true
  },
  {
    name: "Weststadt Quiet Grind",
    lat: 49.1512,
    lng: 9.2015,
    total_stipulated_tables: 14,
    current_occupied_tables: 3,
    footfall_metric: 55,
    reduce_margin: true
  },
  {
    name: "Oststadt Night Owl",
    lat: 49.1489,
    lng: 9.2321,
    total_stipulated_tables: 18,
    current_occupied_tables: 5,
    footfall_metric: 78,
    reduce_margin: false
  },
  {
    name: "Flein Gate Roastery",
    lat: 49.1567,
    lng: 9.2254,
    total_stipulated_tables: 10,
    current_occupied_tables: 2,
    footfall_metric: 40,
    reduce_margin: true
  },
  {
    name: "Trappensee Lakeside Desk",
    lat: 49.1321,
    lng: 9.2398,
    total_stipulated_tables: 26,
    current_occupied_tables: 7,
    footfall_metric: 102,
    reduce_margin: false
  },
  {
    name: "Alte Zuckerfabrik Co-Work Café",
    lat: 49.1398,
    lng: 9.2056,
    total_stipulated_tables: 32,
    current_occupied_tables: 11,
    footfall_metric: 175,
    reduce_margin: false
  },
  {
    name: "Deutschhof Passage Coffee",
    lat: 49.1426,
    lng: 9.2167,
    total_stipulated_tables: 15,
    current_occupied_tables: 4,
    footfall_metric: 62,
    reduce_margin: true
  },
  {
    name: "Harmonie Halls Study Bar",
    lat: 49.1403,
    lng: 9.2289,
    total_stipulated_tables: 21,
    current_occupied_tables: 6,
    footfall_metric: 90,
    reduce_margin: false
  },
  {
    name: "Kaufland Block Focus Bean",
    lat: 49.1467,
    lng: 9.1987,
    total_stipulated_tables: 19,
    current_occupied_tables: 5,
    footfall_metric: 70,
    reduce_margin: true
  },
  {
    name: "Neckartal Radweg Stop",
    lat: 49.1334,
    lng: 9.2145,
    total_stipulated_tables: 8,
    current_occupied_tables: 1,
    footfall_metric: 28,
    reduce_margin: true
  },
  {
    name: "Pfühlpark Bench & Bean",
    lat: 49.1589,
    lng: 9.2112,
    total_stipulated_tables: 11,
    current_occupied_tables: 2,
    footfall_metric: 35,
    reduce_margin: true
  },
  {
    name: "Bildungscampus Süd Espresso",
    lat: 49.1211,
    lng: 9.2034,
    total_stipulated_tables: 35,
    current_occupied_tables: 14,
    footfall_metric: 190,
    reduce_margin: false
  },
  {
    name: "Südbahnhof Transit Grind",
    lat: 49.1378,
    lng: 9.2334,
    total_stipulated_tables: 17,
    current_occupied_tables: 5,
    footfall_metric: 68,
    reduce_margin: false
  },
  {
    name: "Wartberg Viewpoint Café",
    lat: 49.1623,
    lng: 9.2189,
    total_stipulated_tables: 9,
    current_occupied_tables: 2,
    footfall_metric: 32,
    reduce_margin: true
  }
] as const;

const ALL_SEED_CAFE_LOCATIONS = [...TEST_CAFE_LOCATIONS, ...HEILBRONN_PARTNER_CAFES];

export const seedCafeLocations = mutationGeneric({
  args: {
    /** If true, insert every row even when the same name already exists (can create duplicates). */
    forceDuplicateNames: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const inserted: string[] = [];
    const skipped: string[] = [];

    for (const row of ALL_SEED_CAFE_LOCATIONS) {
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

/**
 * Create a lock-in reservation for a random user.
 * Run: npx convex run seed:seedLockInReservation
 * @param forNow - If true (default), reservation is valid for the next 2 hours from now (for testing).
 *                 If false, reservation is tomorrow 12:00 AM–2:00 AM UTC.
 */
export const seedLockInReservation = mutationGeneric({
  args: {
    forNow: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("No users in database. Sign up first.");

    const cafe = await ctx.db.query("cafe_locations").first();
    const spot = await ctx.db.query("study_spots").first();
    const location = cafe ?? spot;
    if (!location) throw new Error("No cafe_locations or study_spots. Run seed:seedCafeLocations first.");

    const now = Date.now();
    let startTime: number;
    let endTime: number;
    if (args.forNow !== false) {
      startTime = now;
      endTime = now + 2 * 60 * 60 * 1000;
    } else {
      const d = new Date(now);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() + 1);
      startTime = d.getTime();
      endTime = startTime + 2 * 60 * 60 * 1000;
    }
    const duration = Math.floor((endTime - startTime) / 60000);

    const id = await ctx.db.insert("lock_in_reservations", {
      user_id: "m9786jr5ksd3qg824k6ddv9v1583ad85",
      location_id: "jx71gwm369t5yd8123jhdx21w983bn6r",
      start_time: startTime,
      end_time: endTime,
      duration,
      status: "active"
    });

    const qrPayload = cafe
      ? `s2g:cafe:${location._id}`
      : `s2g:spot:${location._id}`;

    return {
      reservationId: id,
      userId: user._id,
      locationId: location._id,
      locationName: "name" in location ? location.name : undefined,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMinutes: duration,
      forNow: args.forNow !== false,
      qrPayload,
      hint: `Scan a QR with ${qrPayload} (or paste that into a QR generator) to check in at this venue.`
    };
  }
});
