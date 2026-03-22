import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { api } from "@/lib/convexApi";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

export function DiscoverScreen() {
  const recommendations = useQuery(api.collaborationRecommendations.getRecommendationsForCurrentUser, {});

  return (
    <ScreenContainer tabTitle="Discover">
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Study2Gather</Text>
        <Text style={styles.heroTitle}>Find your study crew</Text>
        <Text style={styles.heroBody}>
          Match on school, course, and study habits. Swipe lists and chat are coming next — for now, browse
          suggested partners.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Suggested for you</Text>
      {recommendations === undefined ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : recommendations === null || recommendations.length === 0 ? (
        <AppCard muted style={styles.emptyCard}>
          <Text style={styles.emptyText}>No recommendations yet</Text>
        </AppCard>
      ) : (
        recommendations.map((p) => (
          <AppCard key={p.id} style={styles.matchCard}>
            <View style={styles.matchRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(p.username ?? p.id).slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.matchMeta}>
                <Text style={styles.matchName}>{p.username ?? "Anonymous"}</Text>
                <Text style={styles.matchDetail}>
                  {[p.school, p.course].filter(Boolean).join(" · ") || "—"}
                </Text>
              </View>
              <View style={styles.scorePill}>
                <Text style={styles.scoreLabel}>match</Text>
              </View>
            </View>
          </AppCard>
        ))
      )}

      <AppCard muted style={styles.hintCard}>
        <Text style={styles.hintTitle}>How matching works</Text>
        <Text style={styles.hintBody}>
          We prioritize overlap in courses, schedules, and study goals so you meet people who fit how you work.
          Suggestions update as you add more to your profile.
        </Text>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: space.xl,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.heroGradientTop,
    borderWidth: 1,
    borderColor: "#E0E7FF"
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: space.sm
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: space.sm
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: space.md
  },
  loadingWrap: {
    paddingVertical: space.xl,
    alignItems: "center"
  },
  emptyCard: {
    paddingVertical: space.xl
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center"
  },
  matchCard: {
    marginBottom: space.md,
    paddingVertical: space.md
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: space.md
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary
  },
  matchMeta: {
    flex: 1
  },
  matchName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary
  },
  matchDetail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2
  },
  scorePill: {
    alignItems: "flex-end"
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase"
  },
  hintCard: {
    marginTop: space.md
  },
  hintTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: space.sm
  },
  hintBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary
  }
});
