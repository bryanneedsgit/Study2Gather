/**
 * Study spots directory (libraries, cafés, quiet spaces on the map).
 *
 * Relationship to `cafe_locations`:
 * - `cafe_locations` = operational partner venues (capacity, seat holds, reservations, footfall).
 * - `study_spots` = lightweight POI records for discovery / map pins (`type`, `is_partner`).
 * A real partner café might appear in both tables with different IDs — link in app logic later if needed;
 * we do not merge them in the schema to avoid coupling booking rules to the map layer.
 *
 * Geo: Convex has no PostGIS — we load all `study_spots` and compute Haversine distance in memory
 * (hackathon scale). For production, add geohash buckets or an external geo index.
 */
import { queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers. */
function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
  return EARTH_RADIUS_KM * c;
}

function assertValidLatLng(lat: number, lng: number): void {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error("invalid_coordinates");
  if (lat < -90 || lat > 90) throw new Error("invalid_latitude");
  if (lng < -180 || lng > 180) throw new Error("invalid_longitude");
}

function spotWithDistance(
  spot: Doc<"study_spots">,
  distanceKm: number
): {
  _id: Id<"study_spots">;
  name: string;
  description: string | undefined;
  lat: number;
  lng: number;
  type: string;
  is_partner: boolean;
  distanceKm: number;
  distanceMeters: number;
} {
  return {
    _id: spot._id,
    name: spot.name,
    description: spot.description,
    lat: spot.lat,
    lng: spot.lng,
    type: spot.type,
    is_partner: spot.is_partner,
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    distanceMeters: Math.round(distanceKm * 1000)
  };
}

export const getNearbyStudySpots = queryGeneric({
  args: {
    lat: v.number(),
    lng: v.number(),
    /** Max rows returned after sorting by distance (closest first). Default 30, max 100. */
    limit: v.optional(v.number()),
    /** Only include spots within this radius (km). Default 50. Max 500. */
    maxDistanceKm: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    assertValidLatLng(args.lat, args.lng);
    const cap = Math.min(Math.max(1, args.limit ?? 30), 100);
    const maxKm = Math.min(Math.max(0.1, args.maxDistanceKm ?? 50), 500);

    const all = await ctx.db.query("study_spots").collect();

    const withDist = all
      .map((spot) => ({
        spot,
        km: haversineDistanceKm(args.lat, args.lng, spot.lat, spot.lng)
      }))
      .filter(({ km }) => km <= maxKm)
      .sort((a, b) => a.km - b.km)
      .slice(0, cap)
      .map(({ spot, km }) => spotWithDistance(spot, km));

    return {
      center: { lat: args.lat, lng: args.lng },
      maxDistanceKm: maxKm,
      count: withDist.length,
      spots: withDist
    };
  }
});

export const getPartnerStudySpots = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("study_spots")
      .withIndex("by_partner", (q) => q.eq("is_partner", true))
      .collect();

    rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    return {
      count: rows.length,
      spots: rows.map((s) => ({
        _id: s._id,
        name: s.name,
        description: s.description,
        lat: s.lat,
        lng: s.lng,
        type: s.type,
        is_partner: s.is_partner
      }))
    };
  }
});

export const getStudySpotById = queryGeneric({
  args: {
    studySpotId: v.id("study_spots")
  },
  handler: async (ctx, args) => {
    const spot = await ctx.db.get(args.studySpotId);
    if (!spot) return null;
    return {
      _id: spot._id,
      name: spot.name,
      description: spot.description,
      lat: spot.lat,
      lng: spot.lng,
      type: spot.type,
      is_partner: spot.is_partner
    };
  }
});
