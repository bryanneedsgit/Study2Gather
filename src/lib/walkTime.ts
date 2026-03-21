/**
 * Display helper for server-computed walk minutes (`estimatedWalkMinutes` from `cafeLocations.getNearbyCafeLocations`).
 */
export function formatWalkMinutes(minutes: number): string {
  const n = Number.isFinite(minutes) ? Math.max(1, Math.round(minutes)) : 1;
  return `${n} min walk`;
}
