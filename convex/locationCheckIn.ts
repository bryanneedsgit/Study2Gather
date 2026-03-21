/**
 * QR + GPS check-in flow for gating solo lock-in.
 * @see docs/LOCK_IN_QR.md for payload format (for the scanner UI).
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { distanceMeters } from "./geoUtils";

/** Max distance from recorded lat/lng to accept GPS (meters). */
export const CHECK_IN_RADIUS_METERS = 150;

/** How long a check-in stays valid if unused (ms). */
export const CHECK_IN_MAX_TTL_MS = 8 * 60 * 60 * 1000;

const QR_PREFIX = "s2g:";

export type ParsedQr =
  | { kind: "study_spot"; id: Id<"study_spots"> }
  | { kind: "cafe"; id: Id<"cafe_locations"> };

/**
 * Parse QR raw string. Supported:
 * - `s2g:spot:<convexId>` / `s2g:cafe:<convexId>`
 * - JSON: `{"v":1,"t":"spot"|"cafe","id":"<convexId>"}`
 */
export function parseQrPayload(raw: string): { ok: true; parsed: ParsedQr } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "empty_qr" };

  if (trimmed.startsWith("{")) {
    try {
      const j = JSON.parse(trimmed) as { v?: number; t?: string; id?: string };
      if (j.v !== 1 || !j.id || typeof j.id !== "string") {
        return { ok: false, error: "invalid_json_payload" };
      }
      if (j.t === "spot") {
        return { ok: true, parsed: { kind: "study_spot", id: j.id as Id<"study_spots"> } };
      }
      if (j.t === "cafe") {
        return { ok: true, parsed: { kind: "cafe", id: j.id as Id<"cafe_locations"> } };
      }
      return { ok: false, error: "invalid_json_type" };
    } catch {
      return { ok: false, error: "json_parse_error" };
    }
  }

  if (!trimmed.startsWith(QR_PREFIX)) {
    return { ok: false, error: "unknown_prefix" };
  }
  const rest = trimmed.slice(QR_PREFIX.length);
  const colon = rest.indexOf(":");
  if (colon <= 0) return { ok: false, error: "invalid_format" };
  const kind = rest.slice(0, colon);
  const id = rest.slice(colon + 1);
  if (!id) return { ok: false, error: "missing_id" };

  if (kind === "spot") {
    return { ok: true, parsed: { kind: "study_spot", id: id as Id<"study_spots"> } };
  }
  if (kind === "cafe") {
    return { ok: true, parsed: { kind: "cafe", id: id as Id<"cafe_locations"> } };
  }
  return { ok: false, error: "invalid_kind" };
}

/** Public: parse only (no DB). For client-side preview. */
export const parseQrCode = queryGeneric({
  args: { raw: v.string() },
  handler: async (_ctx, args) => {
    return parseQrPayload(args.raw);
  }
});

/** Parse + load location from DB if it exists. */
export const getQrLocationPreview = queryGeneric({
  args: { raw: v.string() },
  handler: async (ctx, args) => {
    const parsed = parseQrPayload(args.raw);
    if (!parsed.ok) {
      return { ok: false as const, error: parsed.error };
    }
    if (parsed.parsed.kind === "study_spot") {
      const spot = await ctx.db.get(parsed.parsed.id);
      if (!spot) return { ok: false as const, error: "spot_not_found" };
      return {
        ok: true as const,
        kind: "study_spot" as const,
        id: spot._id,
        name: spot.name,
        lat: spot.lat,
        lng: spot.lng
      };
    }
    const cafe = await ctx.db.get(parsed.parsed.id);
    if (!cafe) return { ok: false as const, error: "cafe_not_found" };
    return {
      ok: true as const,
      kind: "cafe" as const,
      id: cafe._id,
      name: cafe.name,
      lat: cafe.lat,
      lng: cafe.lng
    };
  }
});

export const getActiveLocationCheckIn = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const now = Date.now();
    const rows = await ctx.db
      .query("lock_in_location_check_ins")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const active =
      rows.find((row) => row.expires_at > now) ??
      null;
    if (!active) return null;

    let locationName: string | undefined;
    if (active.study_spot_id) {
      const spot = await ctx.db.get(active.study_spot_id);
      locationName = spot?.name;
    } else if (active.cafe_id) {
      const cafe = await ctx.db.get(active.cafe_id);
      locationName = cafe?.name;
    }

    return {
      _id: active._id,
      verified_at: active.verified_at,
      expires_at: active.expires_at,
      study_spot_id: active.study_spot_id,
      cafe_id: active.cafe_id,
      locationName
    };
  }
});

export const completeLocationCheckIn = mutationGeneric({
  args: {
    raw: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    nowMs: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    if (
      !Number.isFinite(args.latitude) ||
      !Number.isFinite(args.longitude) ||
      Math.abs(args.latitude) > 90 ||
      Math.abs(args.longitude) > 180
    ) {
      throw new Error("invalid_coordinates");
    }

    const parsed = parseQrPayload(args.raw);
    if (!parsed.ok) throw new Error(parsed.error);

    let lat: number;
    let lng: number;
    let studySpotId: Id<"study_spots"> | undefined;
    let cafeId: Id<"cafe_locations"> | undefined;

    if (parsed.parsed.kind === "study_spot") {
      const spot = await ctx.db.get(parsed.parsed.id);
      if (!spot) throw new Error("spot_not_found");
      lat = spot.lat;
      lng = spot.lng;
      studySpotId = spot._id;
    } else {
      const cafe = await ctx.db.get(parsed.parsed.id);
      if (!cafe) throw new Error("cafe_not_found");
      lat = cafe.lat;
      lng = cafe.lng;
      cafeId = cafe._id;
    }

    const d = distanceMeters({ lat, lng }, { lat: args.latitude, lng: args.longitude });
    if (d > CHECK_IN_RADIUS_METERS) {
      throw new Error("location_too_far");
    }

    const expiresAt = args.nowMs + CHECK_IN_MAX_TTL_MS;

    const previous = await ctx.db
      .query("lock_in_location_check_ins")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const row of previous) {
      await ctx.db.patch(row._id, { status: "expired" });
    }

    const checkInId = await ctx.db.insert("lock_in_location_check_ins", {
      user_id: userId,
      study_spot_id: studySpotId,
      cafe_id: cafeId,
      verified_at: args.nowMs,
      expires_at: expiresAt,
      status: "active"
    });

    return {
      checkInId,
      expiresAt,
      distanceMeters: d,
      radiusMeters: CHECK_IN_RADIUS_METERS
    };
  }
});
