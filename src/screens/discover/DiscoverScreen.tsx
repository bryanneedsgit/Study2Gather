import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "@/components/AppCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

const SUGGESTED = [
  { id: "1", name: "Alex Chen", school: "NUS", course: "Algorithms", score: 94 },
  { id: "2", name: "Sam Rivera", school: "SMU", course: "Data Structures", score: 91 },
  { id: "3", name: "Jordan Lee", school: "NTU", course: "Linear Algebra", score: 88 }
] as const;

export function DiscoverScreen() {
  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Study2Gather</Text>
        <Text style={styles.heroTitle}>Find your study crew</Text>
        <Text style={styles.heroBody}>
          Match on school, course, and study habits. Swipe lists and chat are coming next — for now, browse
          suggested partners.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Suggested for you</Text>
      {SUGGESTED.map((p) => (
        <AppCard key={p.id} style={styles.matchCard}>
          <View style={styles.matchRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{p.name.slice(0, 1)}</Text>
            </View>
            <View style={styles.matchMeta}>
              <Text style={styles.matchName}>{p.name}</Text>
              <Text style={styles.matchDetail}>
                {p.school} · {p.course}
              </Text>
            </View>
            <View style={styles.scorePill}>
              <Text style={styles.scoreValue}>{p.score}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          </View>
        </AppCard>
      ))}

      <AppCard muted style={styles.hintCard}>
        <Text style={styles.hintTitle}>How matching will work</Text>
        <Text style={styles.hintBody}>
          We’ll rank overlap in courses, schedules, and focus goals. Connect Convex session data to replace this
          preview with live results.
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
