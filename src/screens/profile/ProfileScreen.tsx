import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

function tierLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function ProfileScreen() {
  const { user, signOut } = useSession();
  const smokeKey = user?.email?.replace(/[^a-z0-9]/gi, "-") ?? "profile-smoke-test";

  const backendStatus = useQuery(api.queries.getBackendHealth, { key: smokeKey });
  const increment = useMutation(api.mutations.incrementTestCounter);

  return (
    <ScreenContainer>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Account, tier, and Convex health checks.</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutPill}
          onPress={() => void signOut()}
          accessibilityRole="button"
          accessibilityLabel="Log out and return to sign in"
          activeOpacity={0.85}
        >
          <Text style={styles.logoutPillText}>Log out</Text>
        </TouchableOpacity>
      </View>

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
                <Text style={styles.points}>{user.points} pts</Text>
              </View>
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

      <View style={styles.logoutBlock}>
        <Text style={styles.logoutHint}>You'll return to the sign-in screen.</Text>
        <PrimaryButton title="Log out" onPress={() => void signOut()} variant="danger" />
      </View>

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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.md,
    marginBottom: space.lg
  },
  titleBlock: {
    flex: 1,
    minWidth: 0
  },
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
    color: colors.textSecondary
  },
  logoutPill: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(248, 113, 113, 0.22)",
    borderWidth: 2,
    borderColor: "#F87171",
    flexShrink: 0
  },
  logoutPillText: {
    color: "#FECACA",
    fontSize: 15,
    fontWeight: "800"
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
  points: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textSecondary
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
  logoutBlock: {
    marginBottom: space.xl
  },
  logoutHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: space.sm,
    lineHeight: 18
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
