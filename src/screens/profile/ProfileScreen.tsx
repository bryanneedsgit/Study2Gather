import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import type { Id } from "../../../convex/_generated/dataModel";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function ProfileScreen() {
  const { user } = useSession();
  const userId = user?._id as Id<"users"> | undefined;
  const smokeKey = user?.email?.replace(/[^a-z0-9]/gi, "-") ?? "profile-smoke-test";

  /** Same computation as Leaderboard tab (monthly points from completed solo + group sessions this UTC month). */
  const leaderboardRank = useQuery(api.leaderboard.getUserRank, userId ? { userId } : "skip");

  const backendStatus = useQuery(
    api.queries.getBackendHealth,
    __DEV__ ? { key: smokeKey } : "skip"
  );
  const increment = useMutation(api.mutations.incrementTestCounter);

  return (
    <ScreenContainer tabTitle="Profile">
      <Text style={styles.subtitle}>Your account, tier, and points.</Text>

      {user ? (
        <AppCard style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.email ?? "?").slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.email}>{user.email ?? "—"}</Text>
              <View style={styles.tierRow}>
                <Text style={styles.tierBadge}>{tierLabel(user.tier_status)}</Text>
              </View>
              <Text style={styles.pointsBalance}>
                <Text style={styles.pointsBalanceLabel}>Total points</Text> — {user.points} pts
              </Text>
              <Text style={styles.pointsHint}>Spend these in Rewards (balance on your account).</Text>
              {leaderboardRank === undefined ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
              ) : leaderboardRank.found ? (
                <View style={styles.leaderboardStrip}>
                  <Text style={styles.leaderboardStripLabel}>Leaderboard this month (UTC)</Text>
                  <Text style={styles.leaderboardStripValue}>
                    {leaderboardRank.stats.monthlyPoints} month pts · #{leaderboardRank.rank} of{" "}
                    {leaderboardRank.totalRankedUsers}
                  </Text>
                  <Text style={styles.leaderboardStripHint}>
                    From completed solo lock-in and group study sessions — same as the Leaderboard tab.
                  </Text>
                </View>
              ) : (
                <Text style={styles.leaderboardMissing}>Leaderboard rank for this month isn’t available yet.</Text>
              )}
            </View>
          </View>
          {(user.school || user.course || user.age != null) && (
            <View style={styles.grid}>
              {user.school ? (
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>School</Text>
                  <Text style={styles.cellValue}>{user.school}</Text>
                </View>
              ) : null}
              {user.course ? (
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>Course</Text>
                  <Text style={styles.cellValue}>{user.course}</Text>
                </View>
              ) : null}
              {user.age != null ? (
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>Age</Text>
                  <Text style={styles.cellValue}>{String(user.age)}</Text>
                </View>
              ) : null}
            </View>
          )}
        </AppCard>
      ) : null}

      {__DEV__ ? (
        <>
          <Text style={styles.devHeading}>Developer</Text>
          <AppCard muted>
            {backendStatus === undefined ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.devText}>
                {backendStatus.message} · smoke count {backendStatus.count} · users {backendStatus.totalUsers}
              </Text>
            )}
            <PrimaryButton
              title="Increment test counter"
              onPress={() => increment({ key: smokeKey })}
              variant="secondary"
              style={styles.devBtn}
            />
          </AppCard>
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: space.lg
  },
  hero: {
    marginBottom: space.lg
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary
  },
  heroText: {
    flex: 1
  },
  email: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: space.sm,
    gap: space.md
  },
  pointsBalance: {
    marginTop: space.md,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary
  },
  pointsBalanceLabel: {
    color: colors.primary
  },
  pointsHint: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18
  },
  leaderboardStrip: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  leaderboardStripLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  leaderboardStripValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary
  },
  leaderboardStripHint: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17
  },
  leaderboardMissing: {
    marginTop: space.md,
    fontSize: 13,
    color: colors.textMuted
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden"
  },
  grid: {
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: space.md
  },
  cell: {},
  cellLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  cellValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 4
  },
  devHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: space.md
  },
  devText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  },
  devBtn: {
    marginTop: space.md
  }
});
