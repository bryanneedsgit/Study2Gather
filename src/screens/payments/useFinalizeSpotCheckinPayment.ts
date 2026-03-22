import { useCallback } from "react";
import { Alert } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useMutation } from "convex/react";
import { api } from "@/lib/convexApi";
import type { MainAppStackParamList } from "@/navigation/types";
import { useReservationVoucherBanner } from "@/context/ReservationVoucherContext";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * After €5 Stripe payment, record the spot check-in voucher in Convex.
 */
export function useFinalizeSpotCheckinPayment() {
  const route = useRoute<RouteProp<MainAppStackParamList, "Payment">>();
  const navigation = useNavigation();
  const addVoucher = useMutation(api.cafe.addSpotCheckInVoucherForReservation);
  const { markSpotCheckinPurchased } = useReservationVoucherBanner();

  return useCallback(async () => {
    const p = route.params?.afterPaySpotCheckin;
    if (!p) return;

    try {
      await addVoucher({
        reservationId: p.reservationId as Id<"reservations">
      });
      markSpotCheckinPurchased();
      Alert.alert(
        "Check-in voucher added",
        `You have a €5 voucher to redeem at ${p.cafeName} when you check in on the spot. Show it at the counter with the Menu tab.`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert(
        "Payment received",
        `We could not attach the check-in voucher (${msg}). Contact support with your receipt if you were charged.`
      );
    } finally {
      navigation.goBack();
    }
  }, [addVoucher, markSpotCheckinPurchased, navigation, route.params]);
}
