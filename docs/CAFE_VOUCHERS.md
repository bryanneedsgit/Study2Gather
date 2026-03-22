# Café reservation vouchers

After a **time-based reservation** is created (`createTimeBasedReservation`), the backend automatically inserts a **`coupon_purchases`** row:

| Field | Value |
|-------|--------|
| `voucher_kind` | `reservation_redeem` |
| `redeem_value_euro` | Same as the reservation total (`cost`) — what the student paid for the slot |
| `amount_paid` | `0` (value is included in the reservation payment) |
| `status` | `paid` |

So **if they do not** buy the €5 add-on, their **store coupon value is the reservation amount**.

## Optional €5 on-the-spot check-in voucher

After reserving, students can pay **€5** in the app (same Stripe Payment flow). On success, the client calls **`cafe:addSpotCheckInVoucherForReservation`**, which adds a second coupon:

| Field | Value |
|-------|--------|
| `voucher_kind` | `spot_checkin_5` |
| `redeem_value_euro` | `5` |
| `amount_paid` | `5` |

**Note:** Granting the voucher after payment is **client-triggered** (suitable for a hackathon). Production should confirm payment via **Stripe webhooks** before inserting the row.

## UI

- **Alert** after reserve / after pay+reserve explains the reservation coupon.
- **Banner** on **Study Spots** repeats the message and offers **Purchase €5 check-in voucher** when Stripe is configured.

Both coupons count as **paid** coupons for the café in **`cafeMenu:getCafeMenuForUser`** (Menu tab after check-in).
