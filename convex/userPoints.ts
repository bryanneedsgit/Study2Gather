/** Canonical balance: newer rows use `points`; legacy rows may only have `points_total`. */
export function userPointsBalance(user: {
  points?: number | null;
  points_total?: number | null;
}): number {
  return user.points ?? user.points_total ?? 0;
}
