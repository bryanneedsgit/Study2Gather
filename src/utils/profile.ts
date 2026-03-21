/** Server sets `onboarding_completed` — use as single source of truth for routing. */
export function isOnboardingComplete(user: { onboarding_completed?: boolean } | null | undefined): boolean {
  return Boolean(user?.onboarding_completed);
}
