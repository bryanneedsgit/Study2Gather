/**
 * Haversine distance on the WGS84 sphere (meters).
 */

/** Assumed average walking speed for simple ETAs (straight-line / “as the crow flies” distance). */
export const WALK_SPEED_KMH = 5;

/**
 * Whole minutes to walk straight-line `distanceMeters` at {@link WALK_SPEED_KMH} km/h.
 * Deterministic: `max(1, round((distanceKm / WALK_SPEED_KMH) * 60))` with `distanceKm = meters / 1000`.
 */
export function estimatedWalkMinutesFromDistanceMeters(distanceMeters: number): number {
  if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) return 1;
  const distanceKm = distanceMeters / 1000;
  const minutes = Math.round((distanceKm / WALK_SPEED_KMH) * 60);
  return Math.max(1, minutes);
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}
