# Lock-In QR + GPS check-in

Solo **Start locked in** is gated until the user completes a **location check-in** (scan valid QR → server confirms location exists → GPS within radius → `completeLocationCheckIn`). The check-in is **consumed** when lock-in actually starts (one QR flow per lock-in session).

## QR payload format (encode in printed QR / scanner)

The scanner should pass the **raw string** from the QR to the backend.

### 1) Compact (recommended)

```
s2g:spot:<convexStudySpotId>
s2g:cafe:<convexCafeId>
```

Example: `s2g:cafe:jd7abc123...`

- `spot` = row in `study_spots`
- `cafe` = row in `cafe_locations`

Use the document **`_id`** from Convex (Dashboard, `seed:seedCafeLocations`, or Data tab).

### 1b) Bare `_id` (café or study spot)

You can also encode **only** the Convex document id (no prefix). The server looks up **`cafe_locations`** first, then **`study_spots`**, and rejects if neither exists (`location_not_found`).

Example: `jd7abc123...` (same string as `_id` in the dashboard).

### 2) JSON

```json
{"v":1,"t":"spot","id":"<convexStudySpotId>"}
```

`"t"` is `"spot"` or `"cafe"`.

## Convex API (already implemented)

| Step | Function | Notes |
|------|----------|--------|
| Parse only (optional) | `api.locationCheckIn.parseQrCode` `{ raw }` | `{ ok, parsed? }` or `{ ok: false, error }` |
| Validate + load coords | `api.locationCheckIn.getQrLocationPreview` `{ raw }` | `{ ok, name, lat, lng, kind }` or error (`spot_not_found`, etc.) |
| **Complete check-in** | `api.locationCheckIn.completeLocationCheckIn` `{ raw, latitude, longitude, nowMs }` | Requires **authenticated** user. Resolves `raw` to a venue row by `_id`, then throws `location_too_far` if GPS is too far from that row’s **`lat` / `lng`**. |
| UI: enable lock button | `api.locationCheckIn.getActiveLocationCheckIn` `{}` | Returns `null` if no valid check-in. |

Then the user taps **Start locked in** → `api.lockInSolo.startSoloLockIn` (requires active check-in).

### Constants (server)

- **Radius:** `CHECK_IN_RADIUS_METERS` in `convex/locationCheckIn.ts` (default **150** m).
- **Check-in TTL:** `CHECK_IN_MAX_TTL_MS` (default **8 hours**) after `completeLocationCheckIn` if lock-in never starts.

### Typical client sequence

1. Open scanner → read `raw` string.
2. (Optional) `getQrLocationPreview` to show venue name before GPS.
3. Request foreground location permission (`expo-location` or similar).
4. Read `latitude` / `longitude`.
5. Call `completeLocationCheckIn({ raw, latitude, longitude, nowMs: Date.now() })`.
6. On success, `getActiveLocationCheckIn` becomes non-null → **Start locked in** enables.

### App implementation (this repo)

- **`src/hooks/useVenueCheckIn.ts`** — requests foreground permission, reads GPS with **`expo-location`**, calls **`completeLocationCheckIn`**. Use **`runCheckIn(rawQr)`** from the scanner screen when a code is scanned (same flow as the Lock-In text field).
- **`src/screens/lockin/LockInScreen.tsx`** — venue check-in UI: paste/test field + **Verify location & unlock** until the full scanner UI lands.
- **`src/screens/check-in/CheckInScreen.tsx`** — QR scanning via **`expo-camera`** `CameraView` (works on **web** too: `getUserMedia` + in-browser QR decode). Browsers require a **secure context** (**https** or **localhost**); plain **http** will block camera access.
- **`app.json`** — `expo-location` config plugin with `locationWhenInUsePermission` (rebuild native dev client after adding: `npx expo prebuild` / EAS dev build if needed).

### Error strings (mutations)

| Error | Meaning |
|-------|---------|
| `not_authenticated` | User must be signed in (Convex Auth). |
| `empty_qr` / `unknown_prefix` / `invalid_format` | Bad QR string. |
| `spot_not_found` / `cafe_not_found` | Parsed ID not in DB (prefixed / JSON). |
| `location_not_found` | Bare `_id` not found in `cafe_locations` or `study_spots`. |
| `invalid_coordinates` | Bad GPS numbers. |
| `location_too_far` | User farther than `CHECK_IN_RADIUS_METERS` from recorded point. |
| `location_check_in_required` | User started lock-in without completing check-in. |

## Auth

`completeLocationCheckIn`, `getActiveLocationCheckIn`, and solo lock-in mutations use **`getAuthUserId`** — the signed-in Convex user, not a client-supplied `userId`.
