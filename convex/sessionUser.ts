import type { GenericQueryCtx } from "convex/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";
import { userPointsBalance } from "./userPoints";

/** Shared profile shape for authenticated session (used by `profile` and `auth` queries). */
export async function getCurrentUserPayload(ctx: GenericQueryCtx<DataModel>) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return {
    ...user,
    points: userPointsBalance(user),
    onboarding_completed: user.onboarding_completed ?? false,
    tier_status: user.tier_status ?? "bronze",
    created_at: user.created_at ?? Date.now()
  };
}
