import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

function formatEur(cents: number | null | undefined): string | null {
  if (cents === undefined || cents === null) return null;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  }).format(cents / 100);
}

type MenuItemRow = {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  cafe_original_price_cents: number | null;
  s2g_special_price_cents: number | null;
  coupon_discount_cents: number;
};

function groupByCategory(items: MenuItemRow[]): Map<string, MenuItemRow[]> {
  const m = new Map<string, MenuItemRow[]>();
  for (const item of items) {
    const key = item.category?.trim() || "Menu";
    const list = m.get(key) ?? [];
    list.push(item);
    m.set(key, list);
  }
  return m;
}

function MenuItemCard({
  row,
  hasReadableCoupons,
  paidCouponCount
}: {
  row: MenuItemRow;
  hasReadableCoupons: boolean;
  paidCouponCount: number;
}) {
  const cafe = formatEur(row.cafe_original_price_cents);
  const s2g = formatEur(row.s2g_special_price_cents);
  const finalCents =
    row.s2g_special_price_cents != null
      ? hasReadableCoupons
        ? Math.max(0, row.s2g_special_price_cents - row.coupon_discount_cents)
        : row.s2g_special_price_cents
      : null;
  const finalP = formatEur(finalCents);
  const hasAnyPrice =
    row.cafe_original_price_cents != null || row.s2g_special_price_cents != null;
  const showStrike =
    row.cafe_original_price_cents != null &&
    row.s2g_special_price_cents != null &&
    row.s2g_special_price_cents < row.cafe_original_price_cents;

  return (
    <AppCard style={styles.card}>
      <Text style={styles.itemName}>{row.name}</Text>
      {row.description ? <Text style={styles.desc}>{row.description}</Text> : null}

      {!hasAnyPrice ? (
        <Text style={styles.askCounter}>Pricing at counter — not orderable in-app.</Text>
      ) : (
        <>
          <View style={styles.priceBlock}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Café list price</Text>
              <Text style={[styles.priceValue, showStrike && styles.strike]}>
                {cafe ?? "—"}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Study2Gather special</Text>
              <Text style={styles.s2gPrice}>{s2g ?? "—"}</Text>
            </View>
          </View>

          <View style={styles.couponBox}>
            <Text style={styles.couponBoxTitle}>Coupons</Text>
            {hasReadableCoupons ? (
              <Text style={styles.couponBoxBody}>
                You have{" "}
                <Text style={styles.couponEm}>
                  {paidCouponCount} paid coupon{paidCouponCount === 1 ? "" : "s"}
                </Text>{" "}
                for this café — apply at checkout to unlock the coupon price below.
              </Text>
            ) : (
              <Text style={styles.couponBoxMuted}>
                No redeemable coupons on file for this café. When you purchase or receive a Study2Gather
                coupon, it will show here and reduce your total.
              </Text>
            )}
          </View>

          <View style={styles.finalRow}>
            <Text style={styles.finalLabel}>Final price</Text>
            <Text style={styles.finalPrice}>{finalP ?? "—"}</Text>
          </View>
        </>
      )}
    </AppCard>
  );
}

export function CafeMenuScreen() {
  const { user, loading: sessionLoading } = useSession();
  const menuState = useQuery(api.cafeMenu.getCafeMenuForUser, sessionLoading ? "skip" : {});

  const grouped = useMemo(() => {
    if (!menuState || menuState.access !== "ok") return null;
    return groupByCategory(menuState.items);
  }, [menuState]);

  if (sessionLoading || user === undefined) {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <Text style={styles.lead}>
          Sign in to see the menu for your partner café after you check in on site.
        </Text>
      </ScreenContainer>
    );
  }

  if (menuState === undefined) {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.muted}>Loading menu…</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (menuState.access === "signed_out") {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <Text style={styles.lead}>Sign in to view your café menu.</Text>
      </ScreenContainer>
    );
  }

  if (menuState.access === "no_check_in") {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <Text style={styles.lead}>
          Check in at your partner café (scan the venue QR on the Check in tab). While your check-in is valid,
          you can view that café&apos;s menu here.
        </Text>
      </ScreenContainer>
    );
  }

  if (menuState.access === "not_cafe") {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <Text style={styles.lead}>
          Menu is only available when you&apos;ve checked in at a partner café (not a study spot). Check in at
          a café to see drinks and food.
        </Text>
      </ScreenContainer>
    );
  }

  if (menuState.access !== "ok" || !grouped) {
    return (
      <ScreenContainer scroll tabTitle="Menu">
        <Text style={styles.lead}>Something went wrong.</Text>
      </ScreenContainer>
    );
  }

  const { cafe, items, menuCouponContext } = menuState;
  const { hasReadableCoupons, paidCouponCount } = menuCouponContext;

  return (
    <ScreenContainer scroll tabTitle="Menu">
      <Text style={styles.lead}>
        You&apos;re checked in at <Text style={styles.cafeEm}>{cafe.name}</Text>. Study2Gather special prices
        are 10% below the café list price; the coupon line shows your price when you claim an eligible coupon
        at checkout.
      </Text>

      {items.length === 0 ? (
        <AppCard muted style={styles.card}>
          <Text style={styles.muted}>No menu items are published for this café yet.</Text>
        </AppCard>
      ) : (
        [...grouped.entries()].map(([category, rows]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            {rows.map((row) => (
              <MenuItemCard
                key={row._id}
                row={row}
                hasReadableCoupons={hasReadableCoupons}
                paidCouponCount={paidCouponCount}
              />
            ))}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg
  },
  cafeEm: {
    color: colors.textPrimary,
    fontWeight: "700"
  },
  centered: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm
  },
  muted: {
    fontSize: 14,
    color: colors.textMuted
  },
  section: {
    marginBottom: space.lg
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: space.sm
  },
  card: {
    marginBottom: space.sm
  },
  itemName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: space.xs
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: space.sm
  },
  askCounter: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: space.xs
  },
  priceBlock: {
    gap: 6,
    marginBottom: space.sm
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary
  },
  strike: {
    textDecorationLine: "line-through",
    opacity: 0.75
  },
  s2gPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary
  },
  couponBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: space.sm,
    marginBottom: space.sm,
    backgroundColor: colors.cardMuted
  },
  couponBoxTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6
  },
  couponBoxBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary
  },
  couponEm: {
    fontWeight: "800",
    color: colors.warning
  },
  couponBoxMuted: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted
  },
  finalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.md,
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary
  }
});
