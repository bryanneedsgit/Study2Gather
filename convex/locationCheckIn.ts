/**
 * QR + GPS check-in flow for gating solo lock-in.
 *
 * Flow: scanned value → resolve to a `cafe_locations` or `study_spots` row by `_id` →
 * compare device GPS to that row’s `lat` / `lng` (Haversine, see CHECK_IN_RADIUS_METERS).
 *
 * @see docs/LOCK_IN_QR.md for payload format (for the scanner UI).
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
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

/** Convex document ids are opaque strings; bare-id QR uses this heuristic before `db.get`. */
function isPlausibleBareConvexId(s: string): boolean {
  return s.length >= 16 && s.length <= 40 && /^[a-z0-9_]+$/i.test(s);
}

export type ResolvedCheckInLocation =
  | {
      ok: true;
      kind: "cafe";
      cafeId: Id<"cafe_locations">;
      name: string;
      lat: number;
      lng: number;
    }
  | {
      ok: true;
      kind: "study_spot";
      studySpotId: Id<"study_spots">;
      name: string;
      lat: number;
      lng: number;
    }
  | { ok: false; error: string };

/**
 * Map QR text → venue row: validates `_id` exists in `cafe_locations` or `study_spots`,
 * returns stored `lat` / `lng` for GPS comparison.
 *
 * Supports:
 * - `s2g:cafe:<_id>` / `s2g:spot:<_id>` and JSON `{ "v":1, "t":"cafe"|"spot", "id":"..." }`
 * - **Bare `_id`**: if the string matches a `cafe_locations` document (tried first), or `study_spots`
 */
type DbReadCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/** `db.get` throws if the string is not a valid Convex-encoded id (e.g. wrong length). */
async function getByIdOrNull<T extends "cafe_locations" | "study_spots">(
  ctx: DbReadCtx,
  _table: T,
  id: string
): Promise<{ doc: Doc<T> } | "invalid_id" | null> {
  try {
    const doc = await ctx.db.get(id as Id<T>);
    return doc ? { doc } : null;
  } catch {
    return "invalid_id";
  }
}

export async function resolveLocationFromQr(
  ctx: DbReadCtx,
  raw: string
): Promise<ResolvedCheckInLocation> {
  const trimmed = raw.trim();
  const parsed = parseQrPayload(trimmed);

  if (parsed.ok) {
    if (parsed.parsed.kind === "study_spot") {
      const got = await getByIdOrNull(ctx, "study_spots", parsed.parsed.id);
      if (got === "invalid_id") return { ok: false, error: "invalid_id" };
      if (!got) return { ok: false, error: "spot_not_found" };
      const spot = got.doc;
      return {
        ok: true,
        kind: "study_spot",
        studySpotId: spot._id,
        name: spot.name,
        lat: spot.lat,
        lng: spot.lng
      };
    }
    const got = await getByIdOrNull(ctx, "cafe_locations", parsed.parsed.id);
    if (got === "invalid_id") return { ok: false, error: "invalid_id" };
    if (!got) return { ok: false, error: "cafe_not_found" };
    const cafe = got.doc;
    return {
      ok: true,
      kind: "cafe",
      cafeId: cafe._id,
      name: cafe.name,
      lat: cafe.lat,
      lng: cafe.lng
    };
  }

  if (isPlausibleBareConvexId(trimmed)) {
    const cafeGot = await getByIdOrNull(ctx, "cafe_locations", trimmed);
    if (cafeGot === "invalid_id") return { ok: false, error: "invalid_id" };
    if (cafeGot) {
      const cafe = cafeGot.doc;
      return {
        ok: true,
        kind: "cafe",
        cafeId: cafe._id,
        name: cafe.name,
        lat: cafe.lat,
        lng: cafe.lng
      };
    }
    const spotGot = await getByIdOrNull(ctx, "study_spots", trimmed);
    if (spotGot === "invalid_id") return { ok: false, error: "invalid_id" };
    if (spotGot) {
      const spot = spotGot.doc;
      return {
        ok: true,
        kind: "study_spot",
        studySpotId: spot._id,
        name: spot.name,
        lat: spot.lat,
        lng: spot.lng
      };
    }
    return { ok: false, error: "location_not_found" };
  }

  return { ok: false, error: parsed.error };
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
    const resolved = await resolveLocationFromQr(ctx, args.raw);
    if (!resolved.ok) {
      return { ok: false as const, error: resolved.error };
    }
    if (resolved.kind === "study_spot") {
      return {
        ok: true as const,
        kind: "study_spot" as const,
        id: resolved.studySpotId,
        name: resolved.name,
        lat: resolved.lat,
        lng: resolved.lng
      };
    }
    return {
      ok: true as const,
      kind: "cafe" as const,
      id: resolved.cafeId,
      name: resolved.name,
      lat: resolved.lat,
      lng: resolved.lng
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

    const resolved = await resolveLocationFromQr(ctx, args.raw);
    if (!resolved.ok) throw new Error(resolved.error);

    const lat = resolved.lat;
    const lng = resolved.lng;
    const studySpotId: Id<"study_spots"> | undefined =
      resolved.kind === "study_spot" ? resolved.studySpotId : undefined;
    const cafeId: Id<"cafe_locations"> | undefined =
      resolved.kind === "cafe" ? resolved.cafeId : undefined;

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
