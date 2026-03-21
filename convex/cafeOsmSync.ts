/**
 * Sync `cafe_locations` opening times from OpenStreetMap via the public Overpass API.
 *
 * - Picks the best nearby `amenity=cafe|coffee_shop|fast_food` with an `opening_hours` tag.
 * - Parses a **subset** of OSM syntax into `opens_local_minute` / `closes_local_minute` (see `osmOpeningHours.ts`).
 * - Does **not** change `timezone_offset_minutes` — keep venue offset from seed/manual (OSM hours are local wall time).
 *
 * Run: `npx convex run cafeOsmSync:syncCafeHoursFromOsm '{"cafeId": "..."}'`
 */
import { v } from "convex/values";
import { actionGeneric } from "convex/server";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { parseOsmOpeningHoursTag } from "./osmOpeningHours";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export type SyncCafeHoursFromOsmResult =
  | {
      ok: true;
      opens_local_minute: number;
      closes_local_minute: number;
      opening_hours_osm_raw: string;
      matchedName: string | null;
      distanceMetersApprox: number;
    }
  | { ok: false; error: "cafe_not_found" }
  | { ok: false; error: "overpass_http_error"; status: number }
  | { ok: false; error: "no_osm_candidate_with_hours"; elementsChecked: number }
  | { ok: false; error: "unparseable_opening_hours"; raw: string; matchedName: string | null }
  | { ok: false; error: "invalid_parsed_window"; raw: string };

export const syncCafeHoursFromOsm = actionGeneric({
  args: {
    cafeId: v.id("cafe_locations"),
    radiusMeters: v.optional(v.number())
  },
  handler: async (ctx, args): Promise<SyncCafeHoursFromOsmResult> => {
    const cafe: Doc<"cafe_locations"> | null = await ctx.runQuery(
      api.crudQueries.getCafeLocation,
      {
        id: args.cafeId
      }
    );
    if (!cafe) {
      return { ok: false as const, error: "cafe_not_found" as const };
    }

    const radius = Math.min(Math.max(args.radiusMeters ?? 150, 30), 500);
    const overpassQl: string = `[out:json][timeout:25];
(
  node["amenity"~"^(cafe|coffee_shop|fast_food)$"](around:${radius},${cafe.lat},${cafe.lng});
  way["amenity"~"^(cafe|coffee_shop|fast_food)$"](around:${radius},${cafe.lat},${cafe.lng});
);
out center tags;`;

    const res: Response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQl)}`
    });

    if (!res.ok) {
      return {
        ok: false as const,
        error: "overpass_http_error" as const,
        status: res.status
      };
    }

    const json = (await res.json()) as {
      elements?: Array<{
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const elements = json.elements ?? [];
    type Row = { dist: number; score: number; hours: string; name?: string };
    const rows: Row[] = [];

    for (const el of elements) {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const oh = el.tags?.opening_hours;
      if (lat === undefined || lng === undefined || !oh) continue;
      rows.push({
        dist: distanceMetersApprox(cafe.lat, cafe.lng, lat, lng),
        score: nameScore(cafe.name, el.tags?.name),
        hours: oh,
        name: el.tags?.name
      });
    }

    if (rows.length === 0) {
      return {
        ok: false as const,
        error: "no_osm_candidate_with_hours" as const,
        elementsChecked: elements.length
      };
    }

    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.dist - b.dist;
    });

    const best = rows[0]!;
    const parsed = parseOsmOpeningHoursTag(best.hours);
    if (!parsed) {
      return {
        ok: false as const,
        error: "unparseable_opening_hours" as const,
        raw: best.hours,
        matchedName: best.name ?? null
      };
    }

    if (parsed.openMin >= parsed.closeMin) {
      return {
        ok: false as const,
        error: "invalid_parsed_window" as const,
        raw: best.hours
      };
    }

    await ctx.runMutation(internal.cafeOsmApply.applyOsmHoursPatch, {
      cafeId: args.cafeId,
      opens_local_minute: parsed.openMin,
      closes_local_minute: parsed.closeMin,
      opening_hours_osm_raw: best.hours
    });

    return {
      ok: true as const,
      opens_local_minute: parsed.openMin,
      closes_local_minute: parsed.closeMin,
      opening_hours_osm_raw: best.hours,
      matchedName: best.name ?? null,
      distanceMetersApprox: Math.round(best.dist)
    };
  }
});

function distanceMetersApprox(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(bLat - aLat);
  const dLng = toR(bLng - aLng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
  return R * c;
}

function nameScore(cafeName: string, osmName: string | undefined): number {
  if (!osmName) return 0;
  const a = cafeName.toLowerCase().trim();
  const b = osmName.toLowerCase().trim();
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 80;
  const words = a.split(/\s+/).filter((w) => w.length > 3);
  let s = 0;
  for (const w of words) {
    if (b.includes(w)) s += 25;
  }
  return s;
}
