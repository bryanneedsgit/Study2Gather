import { useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMutation } from "convex/react";
import { api } from "@/lib/convexApi";
import { useReservationVoucherBanner } from "@/context/ReservationVoucherContext";
import { getCafeReservationUserMessage } from "@/lib/cafeReservationUi";
import type { MainAppStackParamList } from "@/navigation/types";
import { formatStoreLocalDateTime } from "@/lib/storeLocalTime";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * When Payment was opened with `afterPayReserve`, create the café reservation after Stripe succeeds.
 */
export function useFinalizeReservationAfterPayment() {
  const route = useRoute<RouteProp<MainAppStackParamList, "Payment">>();
  const navigation = useNavigation();
  const reserveMutation = useMutation(api.cafe.createTimeBasedReservation);
  const { showBanner } = useReservationVoucherBanner();

  return useCallback(async () => {
    const p = route.params;
    const reserve = p?.afterPayReserve;
    if (!reserve) return;

    const tz = p?.storeTimezoneOffsetMinutes ?? 0;
    const cafeName = (p?.description ?? "Café").replace(/^Café reservation · /, "");
    try {
      const r = await reserveMutation({
        cafeId: reserve.cafeId as Id<"cafe_locations">,
        userId: reserve.userId as Id<"users">,
        startTime: reserve.startTime,
        endTime: reserve.endTime,
        nowMs: Date.now(),
        bookingNowMs: reserve.bookingNowMs
      });
      const endStore = formatStoreLocalDateTime(r.expiresAt, tz);
      const startStore = formatStoreLocalDateTime(reserve.startTime, tz);
      const redeem = r.reservationVoucherRedeemEuro ?? r.totalCost;
      showBanner({
        cafeName,
        reservationId: r.reservationId,
        userId: reserve.userId as Id<"users">,
        redeemReservationEuro: redeem,
        canOfferSpotCheckin: true
      });
      Alert.alert(
        "Reservation confirmed",
        `Store local time: ${startStore} – ${endStore}\nEstimated total: €${r.totalCost.toFixed(2)}.\n\nYou have a store coupon worth €${redeem.toFixed(2)} to redeem at the counter when you visit. Optional: add a €5 on-the-spot check-in voucher from Study Spots.`
      );
    } catch (e) {
      Alert.alert(
        "Payment went through",
        `We could not save your reservation: ${getCafeReservationUserMessage(e)}. If you were charged, contact support with your receipt.`
      );
    } finally {
      navigation.goBack();
    }
  }, [navigation, reserveMutation, route.params, showBanner]);
}
