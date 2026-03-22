import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { AppCard } from "@/components/AppCard";
import { CouponQrModal } from "@/components/CouponQrModal";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useSession } from "@/context/SessionContext";
import { api } from "@/lib/convexApi";
import type { Id } from "../../../convex/_generated/dataModel";
import { colors } from "@/theme/colors";
import { radius, space } from "@/theme/layout";

function formatRedeemedAt(ms: number): string {
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

/** Payload encoded in QR for partner staff (opaque id is the DB token). */
export function rewardVoucherQrPayload(voucherPublicId: string): string {
  return `s2g-reward:${voucherPublicId}`;
}

export function RewardsScreen() {
  const { user } = useSession();
  const userId = user?._id as Id<"users"> | undefined;

  const points = useQuery(api.rewards.getUserPoints, userId ? { userId } : "skip");
  const catalog = useQuery(api.rewards.getAvailableRewards, {});
  const locker = useQuery(api.rewards.getRewardsLocker, userId ? { userId } : "skip");

  const redeemMutation = useMutation(api.rewards.redeemReward);
  const [redeemingId, setRedeemingId] = useState<Id<"reward_catalog"> | null>(null);
  const [qrModal, setQrModal] = useState<{
    title: string;
    subtitle: string;
    value: string;
  } | null>(null);

  const balance = points?.pointsTotal ?? 0;

  const redeemReasonMessage = useCallback((reason: string) => {
    switch (reason) {
      case "insufficient_points":
        return "Not enough points.";
      case "reward_inactive":
        return "This reward is not available.";
      case "reward_not_found":
        return "Reward not found.";
      case "invalid_reward_cost":
        return "Invalid reward configuration.";
      case "user_not_found":
        return "Sign in again.";
      default:
        return reason;
    }
  }, []);

  const onRedeem = useCallback(
    async (rewardId: Id<"reward_catalog">, title: string, cost: number, isQr: boolean) => {
      if (!userId) {
        Alert.alert("Sign in", "Please sign in to redeem rewards.");
        return;
      }
      if (balance < cost) {
        Alert.alert("Not enough points", `You need ${cost} pts (you have ${balance}).`);
        return;
      }
      setRedeemingId(rewardId);
      try {
        const res = await redeemMutation({ userId, rewardId });
        if (!res.ok) {
          Alert.alert("Could not redeem", redeemReasonMessage(res.reason));
          return;
        }
        if (res.voucherPublicId) {
          const payload = rewardVoucherQrPayload(res.voucherPublicId);
          setQrModal({
            title: title,
            subtitle: "€5 café credit — show this QR at a partner Study2Gather café.",
            value: payload
          });
        } else {
          Alert.alert(
            "Redeemed",
            isQr
              ? "Your reward is saved — open My rewards locker to show your QR anytime."
              : `${title} is recorded in your locker. Partner perks may be fulfilled outside the app.`
          );
        }
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setRedeemingId(null);
      }
    },
    [balance, redeemMutation, redeemReasonMessage, userId]
  );

  const openLockerQr = useCallback((title: string, voucherPublicId: string) => {
    setQrModal({
      title,
      subtitle: "Show at the partner café counter.",
      value: rewardVoucherQrPayload(voucherPublicId)
    });
  }, []);

  const lockerRows = useMemo(() => locker ?? [], [locker]);

  return (
    <ScreenContainer tabTitle="Rewards">
      <Text style={styles.subtitle}>
        Spend points on the catalog. QR vouchers (e.g. €5 café coupon) live in{" "}
        <Text style={styles.subtitleEm}>My rewards locker</Text> after you redeem.
      </Text>

      <AppCard style={styles.balance}>
        <Text style={styles.balanceLabel}>Your balance</Text>
        {points === undefined ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
        ) : (
          <Text style={styles.balanceValue}>{balance} pts</Text>
        )}
        <Text style={styles.balanceHint}>Earn more via Lock-In and group study sessions.</Text>
      </AppCard>

      <Text style={styles.section}>My rewards locker</Text>
      {!userId ? (
        <AppCard muted>
          <Text style={styles.empty}>Sign in to see rewards you&apos;ve redeemed.</Text>
        </AppCard>
      ) : locker === undefined ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : lockerRows.length === 0 ? (
        <AppCard muted>
          <Text style={styles.empty}>
            Nothing here yet. Redeem a catalog item below — QR café coupons appear here automatically.
          </Text>
        </AppCard>
      ) : (
        lockerRows.map((row) => (
          <AppCard key={row.redemptionId} style={styles.lockerCard}>
            <View style={styles.lockerTop}>
              <Text style={styles.lockerTitle}>{row.title}</Text>
              <Text style={styles.lockerMeta}>
                {row.pointsSpent} pts · {formatRedeemedAt(row.createdAt)}
              </Text>
            </View>
            {row.voucherPublicId ? (
              <PrimaryButton
                title="Show QR"
                onPress={() => openLockerQr(row.title, row.voucherPublicId!)}
                variant="secondary"
              />
            ) : (
              <Text style={styles.lockerNoQr}>No QR for this perk — follow the reward instructions offline.</Text>
            )}
          </AppCard>
        ))
      )}

      <Text style={[styles.section, { marginTop: space.xl }]}>Catalog</Text>
      {catalog === undefined ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : catalog.length === 0 ? (
        <AppCard muted>
          <Text style={styles.empty}>No rewards are available right now. Check back soon.</Text>
        </AppCard>
      ) : (
        catalog.map((item) => {
          const isQr = item.reward_kind === "cafe_5eur_voucher";
          const canAfford = balance >= item.cost_points;
          const busy = redeemingId === item._id;
          return (
            <AppCard key={item._id} style={styles.item}>
              <View style={styles.itemTop}>
                <View style={styles.itemTitleBlock}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {isQr ? (
                    <View style={styles.qrBadge}>
                      <Text style={styles.qrBadgeText}>Includes QR</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.costPill}>
                  <Text style={styles.costText}>{item.cost_points} pts</Text>
                </View>
              </View>
              {item.description ? <Text style={styles.itemDesc}>{item.description}</Text> : null}
              <PrimaryButton
                title={busy ? "Redeeming…" : "Redeem"}
                onPress={() => void onRedeem(item._id, item.title, item.cost_points, isQr)}
                disabled={!userId || !canAfford || busy}
                loading={busy}
                style={{ marginTop: space.md }}
              />
              {!canAfford && userId ? (
                <Text style={styles.needMore}>Need {item.cost_points - balance} more pts</Text>
              ) : null}
            </AppCard>
          );
        })
      )}

      <CouponQrModal
        visible={qrModal !== null}
        title={qrModal?.title ?? ""}
        subtitle={qrModal?.subtitle}
        qrValue={qrModal?.value ?? ""}
        onClose={() => setQrModal(null)}
      />
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
  subtitleEm: {
    fontWeight: "800",
    color: colors.primary
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
  lockerCard: {
    marginBottom: space.md,
    gap: space.sm
  },
  lockerTop: {
    marginBottom: space.xs
  },
  lockerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary
  },
  lockerMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4
  },
  lockerNoQr: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18
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
  itemTitleBlock: {
    flex: 1,
    gap: 6
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary
  },
  qrBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  qrBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.accent
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
  needMore: {
    marginTop: space.sm,
    fontSize: 12,
    color: colors.warning,
    fontWeight: "600"
  },
  empty: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  }
});
