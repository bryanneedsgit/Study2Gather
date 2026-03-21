import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import type { Id } from "../../../convex/_generated/dataModel";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

export function RewardsScreen() {
  const { user } = useSession();
  const userId = user?._id as Id<"users"> | undefined;

  const points = useQuery(api.rewards.getUserPoints, userId ? { userId } : "skip");
  const catalog = useQuery(api.rewards.getAvailableRewards, {});

  return (
    <ScreenContainer>
      <Text style={styles.title}>Rewards</Text>
      <Text style={styles.subtitle}>Spend lifetime points on perks — catalog is seeded from Convex.</Text>

      <AppCard style={styles.balance}>
        <Text style={styles.balanceLabel}>Your balance</Text>
        {points === undefined ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.balanceValue}>{points?.pointsTotal ?? 0} pts</Text>
        )}
        <Text style={styles.balanceHint}>Earn more via Lock-In and group study sessions.</Text>
      </AppCard>

      <Text style={styles.section}>Catalog</Text>
      {catalog === undefined ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : catalog.length === 0 ? (
        <AppCard muted>
          <Text style={styles.empty}>No active rewards yet. Run the seed mutation from the Convex dashboard.</Text>
        </AppCard>
      ) : (
        catalog.map((item) => (
          <AppCard key={item._id} style={styles.item}>
            <View style={styles.itemTop}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.costPill}>
                <Text style={styles.costText}>{item.cost_points} pts</Text>
              </View>
            </View>
            {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
          </AppCard>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.6,
    marginBottom: space.sm
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg
  },
  balance: {
    marginBottom: space.xl,
    alignItems: "flex-start"
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    marginTop: space.sm
  },
  balanceHint: {
    marginTop: space.sm,
    fontSize: 13,
    color: colors.textSecondary
  },
  section: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: space.md
  },
  item: {
    marginBottom: space.md
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.md
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary
  },
  costPill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 8
  },
  costText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary
  },
  itemDesc: {
    marginTop: space.sm,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  },
  empty: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  }
});
