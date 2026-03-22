import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import type { Id } from "../../../convex/_generated/dataModel";
import { colors } from "@/theme/colors";
import { space } from "@/theme/layout";

export function LeaderboardScreen() {
  const { user } = useSession();
  const userId = user?._id as Id<"users"> | undefined;

  const board = useQuery(api.leaderboard.getLeaderboardPreview, { limit: 15 });
  const rank = useQuery(api.leaderboard.getUserRank, userId ? { userId } : "skip");

  return (
    <ScreenContainer tabTitle="Leaderboard">
      <Text style={styles.subtitle}>
        Monthly competition: points come from <Text style={styles.subEm}>completed group study sessions</Text> this
        UTC calendar month only. This is not the same as your total point balance on Profile (rewards, lock-in, etc.).
      </Text>

      {userId && rank?.found ? (
        <AppCard style={styles.you}>
          <Text style={styles.youLabel}>Your rank (this month)</Text>
          <Text style={styles.youValue}>
            #{rank.rank} of {rank.totalRankedUsers}
          </Text>
          <Text style={styles.youMeta}>
            {rank.stats.monthlyPoints} month pts · {rank.stats.monthlyMinutes} min · {rank.stats.completedSessions}{" "}
            group sessions
          </Text>
        </AppCard>
      ) : userId && rank && rank.found === false ? (
        <AppCard muted>
          <Text style={styles.muted}>We couldn’t load your rank for this month yet.</Text>
        </AppCard>
      ) : null}

      {board === undefined ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
      ) : (
        <>
          <Text style={styles.period}>Period: {board.yearMonth}</Text>
          {board.entries.map((e) => (
            <AppCard key={e.userId} muted style={styles.row}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankNum}>{e.rank}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.name}>{e.displayName}</Text>
                <Text style={styles.school}>{e.school ?? "—"}</Text>
              </View>
              <View style={styles.stats}>
                <Text style={styles.statMain}>{e.monthlyPoints} month pts</Text>
                <Text style={styles.statSub}>{e.monthlyMinutes} min</Text>
              </View>
            </AppCard>
          ))}
        </>
      )}
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
  subEm: {
    fontWeight: "700",
    color: colors.textPrimary
  },
  you: {
    marginBottom: space.xl,
    borderColor: "#C7D2FE",
    backgroundColor: colors.primaryMuted
  },
  youLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  youValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: space.sm
  },
  youMeta: {
    marginTop: space.sm,
    fontSize: 14,
    color: colors.textSecondary
  },
  muted: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  },
  period: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: space.md
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.sm,
    paddingVertical: space.md
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md
  },
  rankNum: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary
  },
  rowBody: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary
  },
  school: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  stats: {
    alignItems: "flex-end"
  },
  statMain: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.textPrimary
  },
  statSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  }
});
