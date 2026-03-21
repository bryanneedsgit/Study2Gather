import { getAuthUserId } from "@convex-dev/auth/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import { getCurrentUserPayload } from "./sessionUser";

/** Current user profile for the authenticated session (Convex Auth). */
export const getCurrentUser = queryGeneric({
  args: {},
  handler: async (ctx) => getCurrentUserPayload(ctx)
});

export const completeOnboarding = mutationGeneric({
  args: {
    school: v.string(),
    course: v.string(),
    age: v.number()
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("not_authenticated");

    const school = args.school.trim();
    const course = args.course.trim();
    if (!school || !course) throw new Error("missing_fields");

    if (!Number.isFinite(args.age) || args.age < 16 || args.age > 99) {
      throw new Error("invalid_age");
    }

    await ctx.db.patch(userId, {
      school,
      course,
      age: Math.floor(args.age),
      onboarding_completed: true
    });

    return { ok: true as const };
  }
});
