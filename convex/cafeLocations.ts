/**
 * Partner cafés (`cafe_locations`) — same distance pattern as `studySpots.getNearbyStudySpots`.
 */
import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { resolveCafeOpeningHours } from "./cafeHours";
import { distanceMeters, estimatedWalkMinutesFromDistanceMeters } from "./geoUtils";

function assertValidLatLng(lat: number, lng: number): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("invalid_coordinates");
  if (lat < -90 || lat > 90) throw new Error("invalid_latitude");
  if (lng < -180 || lng > 180) throw new Error("invalid_longitude");
}

function cafeWithDistance(
  cafe: Doc<"cafe_locations">,
  distanceMetersValue: number
): {
  _id: Id<"cafe_locations">;
  name: string;
  lat: number;
  lng: number;
  total_stipulated_tables: number;
  current_occupied_tables: number;
  footfall_metric: number;
  distanceKm: number;
  distanceMeters: number;
  estimatedWalkMinutes: number;
  timezone_offset_minutes: number;
  opens_local_minute: number;
  closes_local_minute: number;
} {
  const distanceKm = distanceMetersValue / 1000;
  const hours = resolveCafeOpeningHours(cafe);
  return {
    _id: cafe._id,
    name: cafe.name,
    lat: cafe.lat,
    lng: cafe.lng,
    total_stipulated_tables: cafe.total_stipulated_tables,
    current_occupied_tables: cafe.current_occupied_tables,
    footfall_metric: cafe.footfall_metric,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    distanceMeters: Math.round(distanceMetersValue),
    estimatedWalkMinutes: estimatedWalkMinutesFromDistanceMeters(distanceMetersValue),
    timezone_offset_minutes: hours.timezoneOffsetMinutes,
    opens_local_minute: hours.opensLocalMinute,
    closes_local_minute: hours.closesLocalMinute
  };
}

export const getNearbyCafeLocations = queryGeneric({
  args: {
    lat: v.number(),
    lng: v.number(),
    limit: v.optional(v.number()),
    maxDistanceKm: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertValidLatLng(args.lat, args.lng);
    const cap = Math.min(Math.max(1, args.limit ?? 30), 100);
    const maxKm = Math.min(Math.max(0.1, args.maxDistanceKm ?? 50), 500);
    const origin = { lat: args.lat, lng: args.lng };

    const all = await ctx.db.query("cafe_locations").collect();

    const withDist = all
      .map((cafe) => {
        const m = distanceMeters(origin, { lat: cafe.lat, lng: cafe.lng });
        const km = m / 1000;
        return { cafe, m, km };
      })
      .filter(({ km }) => km <= maxKm)
      .sort((a, b) => a.km - b.km)
      .slice(0, cap)
      .map(({ cafe, m }) => cafeWithDistance(cafe, m));

    return {
      center: { lat: args.lat, lng: args.lng },
      maxDistanceKm: maxKm,
      count: withDist.length,
      cafes: withDist
    };
  }
});
