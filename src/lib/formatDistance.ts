/**
 * Single distance string: metres when under 1 km, otherwise kilometres.
 */
export function formatDistanceLabel(distanceMeters: number): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return "—";
  const m = Math.round(distanceMeters);
  if (m < 1000) {
    return `${m} m`;
  }
  const km = m / 1000;
  if (km < 10) {
    const rounded = Math.round(km * 10) / 10;
    return `${rounded} km`;
  }
  return `${Math.round(km)} km`;
}
