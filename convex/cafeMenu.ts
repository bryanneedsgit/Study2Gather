/**
 * Partner café menu — visible when the user has an active check-in at that café (QR + GPS).
 */
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  PARTNER_CAFE_FULL_MENUS,
  inferCafeListPriceCents,
  tieredMenuPricing
} from "./cafeMenuFullMenus";

function mapMenuItemForClient(doc: Doc<"cafe_menu_items">) {
  const legacy = doc.price_cents;
  const cafeOriginal = doc.cafe_original_price_cents ?? legacy ?? null;
  const s2g = doc.s2g_special_price_cents ?? legacy ?? cafeOriginal ?? null;
  const discount = doc.coupon_discount_cents ?? 0;
  const finalWithCoupon = s2g !== null ? Math.max(0, s2g - discount) : null;
  return {
    _id: doc._id,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    cafe_original_price_cents: cafeOriginal,
    s2g_special_price_cents: s2g,
    coupon_discount_cents: discount,
    final_with_coupon_cents: finalWithCoupon
  };
}

export const getCafeMenuForUser = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { access: "signed_out" as const };
    }

    const now = Date.now();
    const checkIns = await ctx.db
      .query("lock_in_location_check_ins")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const activeCheckIn = checkIns.find((row) => row.expires_at > now) ?? null;
    if (!activeCheckIn) {
      return { access: "no_check_in" as const };
    }

    if (!activeCheckIn.cafe_id) {
      return { access: "not_cafe" as const };
    }

    const cafeId = activeCheckIn.cafe_id;
    const cafe = await ctx.db.get(cafeId);
    if (!cafe) {
      return { access: "no_check_in" as const };
    }

    const raw = await ctx.db
      .query("cafe_menu_items")
      .withIndex("by_cafe", (q) => q.eq("cafe_id", cafeId))
      .collect();

    raw.sort((a, b) => a.sort_order - b.sort_order);

    const couponRows = await ctx.db
      .query("coupon_purchases")
      .withIndex("by_cafe", (q) => q.eq("cafe_id", cafeId))
      .collect();
    const paidCouponsHere = couponRows.filter(
      (c) => c.user_id === userId && c.status === "paid"
    );

    return {
      access: "ok" as const,
      cafe: { _id: cafe._id, name: cafe.name },
      menuCouponContext: {
        paidCouponCount: paidCouponsHere.length,
        hasReadableCoupons: paidCouponsHere.length > 0
      },
      items: raw.map((i) => mapMenuItemForClient(i))
    };
  }
});

/** Dev: add a small demo menu to every café that has no items yet. */
export const seedDemoMenuItems = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const cafes = await ctx.db.query("cafe_locations").collect();
    let inserted = 0;
    for (const cafe of cafes) {
      const existing = await ctx.db
        .query("cafe_menu_items")
        .withIndex("by_cafe", (q) => q.eq("cafe_id", cafe._id))
        .first();
      if (existing) continue;

      const demo: {
        name: string;
        category: string;
        sort_order: number;
        description?: string;
        cafe_original_price_cents: number;
        s2g_special_price_cents: number;
        coupon_discount_cents: number;
        price_cents: number;
      }[] = [
        { name: "Espresso", category: "Drinks", sort_order: 0, ...tieredMenuPricing(280) },
        { name: "Cappuccino", category: "Drinks", sort_order: 1, ...tieredMenuPricing(350) },
        { name: "Sandwich of the day", category: "Food", sort_order: 2, ...tieredMenuPricing(650) },
        { name: "Study snack plate", category: "Snacks", sort_order: 3, ...tieredMenuPricing(450) }
      ];

      for (const d of demo) {
        await ctx.db.insert("cafe_menu_items", {
          cafe_id: cafe._id,
          name: d.name,
          description: d.description,
          price_cents: d.price_cents,
          cafe_original_price_cents: d.cafe_original_price_cents,
          s2g_special_price_cents: d.s2g_special_price_cents,
          coupon_discount_cents: d.coupon_discount_cents,
          category: d.category,
          sort_order: d.sort_order
        });
        inserted++;
      }
    }
    return { insertedCount: inserted };
  }
});

/**
 * Replace (default) or fill full partner menus for **Marktplatz Lernlounge**, **Experimenta Café Lab**,
 * and **Marina Focus Lounge** — names must match `cafe_locations.name` from seed data.
 *
 *   npx convex run cafeMenu:seedPartnerCafeFullMenus
 *   npx convex run cafeMenu:seedPartnerCafeFullMenus '{"replaceExisting":false}'
 */
export const seedPartnerCafeFullMenus = mutationGeneric({
  args: {
    replaceExisting: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const replaceExisting = args.replaceExisting ?? true;
    const results: {
      cafeName: string;
      status: "ok" | "cafe_not_found" | "skipped_has_items";
      itemCount?: number;
      removedCount?: number;
    }[] = [];

    for (const [cafeName, items] of Object.entries(PARTNER_CAFE_FULL_MENUS)) {
      const cafe = await ctx.db
        .query("cafe_locations")
        .withIndex("by_name", (q) => q.eq("name", cafeName))
        .first();

      if (!cafe) {
        results.push({ cafeName, status: "cafe_not_found" });
        continue;
      }

      const existing = await ctx.db
        .query("cafe_menu_items")
        .withIndex("by_cafe", (q) => q.eq("cafe_id", cafe._id))
        .collect();

      if (!replaceExisting && existing.length > 0) {
        results.push({ cafeName, status: "skipped_has_items" });
        continue;
      }

      let removedCount = 0;
      for (const row of existing) {
        await ctx.db.delete(row._id);
        removedCount++;
      }

      for (const item of items) {
        await ctx.db.insert("cafe_menu_items", {
          cafe_id: cafe._id,
          name: item.name,
          description: item.description,
          category: item.category,
          sort_order: item.sort_order,
          ...(item.price_cents !== undefined ? { price_cents: item.price_cents } : {}),
          ...(item.cafe_original_price_cents !== undefined
            ? { cafe_original_price_cents: item.cafe_original_price_cents }
            : {}),
          ...(item.s2g_special_price_cents !== undefined
            ? { s2g_special_price_cents: item.s2g_special_price_cents }
            : {}),
          ...(item.coupon_discount_cents !== undefined
            ? { coupon_discount_cents: item.coupon_discount_cents }
            : {})
        });
      }

      results.push({
        cafeName,
        status: "ok",
        itemCount: items.length,
        removedCount: replaceExisting ? removedCount : undefined
      });
    }

    return { results };
  }
});

/**
 * Recompute `s2g_special_price_cents`, `coupon_discount_cents`, `price_cents`, and
 * `cafe_original_price_cents` for every menu row from the inferred café list price.
 *
 *   npx convex run cafeMenu:recomputeAllMenuPricingFromCafeList
 */
export const recomputeAllMenuPricingFromCafeList = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("cafe_menu_items").collect();
    let updated = 0;
    let skipped = 0;
    for (const row of rows) {
      const cafeList = inferCafeListPriceCents(row);
      if (cafeList === null) {
        skipped++;
        continue;
      }
      const p = tieredMenuPricing(cafeList);
      await ctx.db.patch(row._id, {
        cafe_original_price_cents: p.cafe_original_price_cents,
        s2g_special_price_cents: p.s2g_special_price_cents,
        coupon_discount_cents: p.coupon_discount_cents,
        price_cents: p.price_cents
      });
      updated++;
    }
    return { updatedCount: updated, skippedCount: skipped, total: rows.length };
  }
});
