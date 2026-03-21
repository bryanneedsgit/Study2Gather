import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Demo-stable auth: find-or-create user by email. No password (upgrade to Convex Auth / magic link later).
 */
export const signInWithEmail = mutationGeneric({
  args: {
    email: v.string()
  },
  handler: async (ctx, args) => {
    const normalized = normalizeEmail(args.email);
    if (!isValidEmail(normalized)) {
      throw new Error("invalid_email");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (existing) {
      return { userId: existing._id, isNew: false as const };
    }

    const userId = await ctx.db.insert("users", {
      email: normalized,
      onboarding_completed: false,
      points_total: 0,
      tier_status: "bronze",
      created_at: Date.now()
    });

    return { userId, isNew: true as const };
  }
});

export const completeOnboarding = mutationGeneric({
  args: {
    userId: v.id("users"),
    school: v.string(),
    course: v.string(),
    age: v.number()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("user_not_found");

    const school = args.school.trim();
    const course = args.course.trim();
    if (!school || !course) throw new Error("missing_fields");

    if (!Number.isFinite(args.age) || args.age < 16 || args.age > 99) {
      throw new Error("invalid_age");
    }

    await ctx.db.patch(args.userId, {
      school,
      course,
      age: Math.floor(args.age),
      onboarding_completed: true
    });

    return { ok: true as const };
  }
});

export const getCurrentUser = queryGeneric({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  }
});
