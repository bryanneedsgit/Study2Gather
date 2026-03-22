import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Id } from "../../convex/_generated/dataModel";

export type ReservationVoucherBanner = {
  cafeName: string;
  reservationId: Id<"reservations">;
  userId: Id<"users">;
  /** Coupon value tied to what they paid for the reservation. */
  redeemReservationEuro: number;
  /** Show optional €5 check-in voucher upsell (Stripe). */
  canOfferSpotCheckin: boolean;
};

type Ctx = {
  banner: ReservationVoucherBanner | null;
  showBanner: (b: ReservationVoucherBanner | null) => void;
  clearBanner: () => void;
  /** After user buys spot check-in, keep notice but hide upsell. */
  markSpotCheckinPurchased: () => void;
};

const ReservationVoucherContext = createContext<Ctx | null>(null);

export function ReservationVoucherProvider({ children }: { children: ReactNode }) {
  const [banner, setBanner] = useState<ReservationVoucherBanner | null>(null);

  const clearBanner = useCallback(() => setBanner(null), []);

  const showBanner = useCallback((b: ReservationVoucherBanner | null) => {
    setBanner(b);
  }, []);

  const markSpotCheckinPurchased = useCallback(() => {
    setBanner((prev) =>
      prev ? { ...prev, canOfferSpotCheckin: false } : prev
    );
  }, []);

  const value = useMemo(
    () => ({ banner, showBanner, clearBanner, markSpotCheckinPurchased }),
    [banner, showBanner, clearBanner, markSpotCheckinPurchased]
  );

  return (
    <ReservationVoucherContext.Provider value={value}>{children}</ReservationVoucherContext.Provider>
  );
}

export function useReservationVoucherBanner(): Ctx {
  const ctx = useContext(ReservationVoucherContext);
  if (!ctx) {
    throw new Error("useReservationVoucherBanner must be used within ReservationVoucherProvider");
  }
  return ctx;
}
