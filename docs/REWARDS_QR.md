# Rewards & café QR vouchers

## Catalog: “5 Euro Cafe Coupon”

- The app calls **`rewards:ensureCafeFiveEuroCatalogEntry`** once when the Rewards tab loads (idempotent).
- It inserts **`reward_catalog`** row with **`reward_kind: "cafe_5eur_voucher"`** if none exists yet.
- **Cost:** 250 points (adjust in `convex/rewards.ts` if needed).

## Redeeming

**`rewards:redeemReward`** deducts points and inserts **`reward_redemptions`** with a random **`voucher_public_id`** when the catalog item is `cafe_5eur_voucher`.

QR payload format: `S2G|R|<redemptionId>|<voucher_public_id>`.

## My Rewards (UI)

- Lists **reward redemptions** (with **Show QR** when `voucher_public_id` is set).
- Lists **paid `coupon_purchases`** (reservation / check-in vouchers) with QR `S2G|C|<couponId>`.

Staff-facing validation of these strings is not implemented yet; treat as a demo token for the hackathon.

## Web

QR in **`CouponQrModal`** uses the **`qrcode`** package (PNG data URL). Native uses **`react-native-qrcode-svg`**.
