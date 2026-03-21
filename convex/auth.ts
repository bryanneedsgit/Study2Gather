import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const user = await ctx.db.get(userId);
      if (!user) return;
      const patch: {
        onboarding_completed?: boolean;
        points?: number;
        tier_status?: "bronze" | "silver" | "gold" | "platinum";
        created_at?: number;
      } = {};
      if (user.onboarding_completed === undefined) patch.onboarding_completed = false;
      if (user.points === undefined) patch.points = 0;
      if (user.tier_status === undefined) patch.tier_status = "bronze";
      if (user.created_at === undefined) patch.created_at = Date.now();
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(userId, patch);
      }
    }
  }
});
