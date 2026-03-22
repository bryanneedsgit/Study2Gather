/**
 * Full menus for selected partner cafés (keys must match `cafe_locations.name` exactly).
 * Run `cafeMenu:seedPartnerCafeFullMenus` after cafés exist in the DB.
 */
export type CafeMenuLineSeed = {
  name: string;
  description?: string;
  /** Legacy fallback; usually equals `s2g_special_price_cents`. */
  price_cents?: number;
  /** List price at the café. */
  cafe_original_price_cents?: number;
  /** Study2Gather partner price before coupon. */
  s2g_special_price_cents?: number;
  /** Cents off when claiming an eligible coupon. */
  coupon_discount_cents?: number;
  category: string;
  sort_order: number;
};

/**
 * `cafeListPriceCents` = café counter list price.
 * Study2Gather special = 10% below that. Optional extra coupon discount is applied on top of S2G at checkout.
 */
export function tieredMenuPricing(cafeListPriceCents: number) {
  const cafe_original_price_cents = cafeListPriceCents;
  const s2g_special_price_cents = Math.round(cafeListPriceCents * 0.9);
  const raw = Math.round(s2g_special_price_cents * 0.1);
  const coupon_discount_cents = Math.min(raw, Math.max(0, s2g_special_price_cents - 50));
  return {
    cafe_original_price_cents,
    s2g_special_price_cents,
    coupon_discount_cents,
    price_cents: s2g_special_price_cents
  };
}

/**
 * Infer the café counter list price (cents) from stored fields so we can migrate rows
 * from the old pricing model (café ≈ 1.15× S2G anchor) to the new one (S2G = 90% of café list).
 */
export function inferCafeListPriceCents(doc: {
  cafe_original_price_cents?: number;
  s2g_special_price_cents?: number;
  price_cents?: number;
}): number | null {
  const cafe = doc.cafe_original_price_cents;
  const s2g = doc.s2g_special_price_cents ?? doc.price_cents;
  if (cafe != null && s2g != null) {
    const oldCafeFromS2g = Math.round(s2g * 1.15);
    if (Math.abs(cafe - oldCafeFromS2g) <= 2) {
      return s2g;
    }
    const newS2gFromCafe = Math.round(cafe * 0.9);
    if (Math.abs(s2g - newS2gFromCafe) <= 2) {
      return cafe;
    }
  }
  if (cafe != null) return cafe;
  if (s2g != null) return s2g;
  if (doc.price_cents != null) return doc.price_cents;
  return null;
}

/** Three venues: Heilbronn Marktplatz, Experimenta area, Marina SG — distinct menus per location. */
export const PARTNER_CAFE_FULL_MENUS: Record<string, CafeMenuLineSeed[]> = {
  "Marktplatz Lernlounge": [
    {
      name: "Espresso",
      description: "Doppio · strong · for deep-focus sessions",
      category: "Heißgetränke",
      sort_order: 0,
      ...tieredMenuPricing(280)
    },
    {
      name: "Cappuccino",
      description: "Espresso, steamed milk, light foam",
      category: "Heißgetränke",
      sort_order: 1,
      ...tieredMenuPricing(380)
    },
    {
      name: "Flat White",
      description: "Double ristretto, velvety milk",
      category: "Heißgetränke",
      sort_order: 2,
      ...tieredMenuPricing(420)
    },
    {
      name: "Apfelschorle",
      description: "Apple spritzer · still or sparkling",
      category: "Kaltgetränke",
      sort_order: 3,
      ...tieredMenuPricing(320)
    },
    {
      name: "Laugenbrezel",
      description: "Buttery pretzel · pairs with coffee",
      category: "Snacks",
      sort_order: 4,
      ...tieredMenuPricing(290)
    },
    {
      name: "Käse-Schinken-Croissant",
      description: "Warm · ham & cheese",
      category: "Snacks",
      sort_order: 5,
      ...tieredMenuPricing(450)
    },
    {
      name: "Gemischter Salat klein",
      description: "Balsamic · add chicken +3.50",
      category: "Mittag",
      sort_order: 6,
      ...tieredMenuPricing(620)
    },
    {
      name: "Tages-Suppe",
      description: "Ask staff · served with bread",
      category: "Mittag",
      sort_order: 7,
      ...tieredMenuPricing(580)
    },
    {
      name: "Student flat rate (2h)",
      description: "One drink + refill filter coffee + seat",
      category: "Study bundles",
      sort_order: 8,
      ...tieredMenuPricing(650)
    }
  ],

  "Experimenta Café Lab": [
    {
      name: "Cold Brew Tower",
      description: "Slow-steeped · large · shareable carafe",
      price_cents: 520,
      category: "Lab drinks",
      sort_order: 0
    },
    {
      name: "Matcha Latte",
      description: "Ceremonial grade · oat or dairy",
      price_cents: 480,
      category: "Lab drinks",
      sort_order: 1
    },
    {
      name: "Sparkling Yuzu",
      description: "Non-caffeinated · citrus",
      price_cents: 390,
      category: "Lab drinks",
      sort_order: 2
    },
    {
      name: "Protein smoothie (berry)",
      description: "Banana, oats, vegan protein",
      price_cents: 720,
      category: "Lab drinks",
      sort_order: 3
    },
    {
      name: "Avocado toast",
      description: "Sourdough, radish, chili flakes",
      price_cents: 890,
      category: "Fuel",
      sort_order: 4
    },
    {
      name: "Quinoa bowl",
      description: "Feta, roasted veg, lemon dressing",
      price_cents: 980,
      category: "Fuel",
      sort_order: 5
    },
    {
      name: "Kids’ science snack box",
      description: "Fruit, cheese cubes, crackers",
      price_cents: 550,
      category: "Fuel",
      sort_order: 6
    },
    {
      name: "Brownie (gluten-aware)",
      description: "Almond flour · ask for allergens",
      price_cents: 420,
      category: "Treats",
      sort_order: 7
    },
    {
      name: "Family study combo",
      description: "2 drinks + 2 snacks · valid same visit",
      price_cents: 2200,
      category: "Bundles",
      sort_order: 8
    }
  ],

  "Marina Focus Lounge": [
    {
      name: "Long black",
      description: "Double shot · hot water",
      category: "Coffee",
      sort_order: 0,
      ...tieredMenuPricing(450)
    },
    {
      name: "Iced latte",
      description: "Oat or full-cream milk",
      category: "Coffee",
      sort_order: 1,
      ...tieredMenuPricing(580)
    },
    {
      name: "Yuan yang",
      description: "Coffee + Hong Kong milk tea",
      category: "Coffee",
      sort_order: 2,
      ...tieredMenuPricing(520)
    },
    {
      name: "Fresh coconut",
      description: "Chilled · whole fruit optional",
      category: "Cold",
      sort_order: 3,
      ...tieredMenuPricing(680)
    },
    {
      name: "Bandung rose",
      description: "Rose syrup + milk · less sweet on request",
      category: "Cold",
      sort_order: 4,
      ...tieredMenuPricing(420)
    },
    {
      name: "Kaya toast set",
      description: "Soft-boiled eggs, kaya, butter, toast",
      category: "All-day",
      sort_order: 5,
      ...tieredMenuPricing(780)
    },
    {
      name: "Laksa lemak (small)",
      description: "Coconut broth · weekday lunch",
      category: "All-day",
      sort_order: 6,
      ...tieredMenuPricing(920)
    },
    {
      name: "Grain bowl (salmon or tofu)",
      description: "Miso dressing, edamame, pickled veg",
      category: "All-day",
      sort_order: 7,
      ...tieredMenuPricing(1280)
    },
    {
      name: "Focus desk add-on",
      description: "Power + quiet zone · 3h window",
      category: "Lounge",
      sort_order: 8,
      ...tieredMenuPricing(800)
    },
    {
      name: "Harbour view window seat",
      description: "Subject to availability · complimentary with any drink · ask counter",
      category: "Lounge",
      sort_order: 9
    }
  ]
};
