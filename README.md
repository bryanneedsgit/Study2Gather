# Study2Gather - Convex Foundation

Hackathon-friendly React Native + TypeScript foundation with Convex backend scaffolding and root navigation.

## Why this setup (fastest stable path)

This project uses **Expo + React Native + TypeScript** because it is the most reliable way to ship a demo quickly in a 2-day hackathon:
- fast bootstrapping and local iteration
- fewer native build issues than bare React Native
- stable ecosystem for navigation and Convex
- easy to extend later with native modules only if needed

## Tech stack

- React Native (Expo) + TypeScript
- React Navigation (native stack + bottom tabs)
- Convex backend + React client

## Folder structure

```txt
.
├── App.tsx
├── app.json
├── babel.config.js
├── index.ts
├── package.json
├── tsconfig.json
├── .env.example
├── src
│   ├── components
│   │   ├── FormField.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── PlaceholderScreen.tsx
│   ├── context
│   │   └── SessionContext.tsx
│   ├── constants
│   │   └── onboardingOptions.ts
│   ├── config
│   │   └── env.ts
│   ├── hooks
│   │   └── useAppTheme.ts
│   ├── lib
│   │   ├── convex.ts
│   │   └── sessionStorage.ts
│   ├── navigation
│   │   ├── MainTabsNavigator.tsx
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── screens
│   │   ├── auth
│   │   │   └── AuthScreen.tsx
│   │   ├── onboarding
│   │   │   └── OnboardingScreen.tsx
│   │   ├── discover
│   │   │   └── DiscoverScreen.tsx
│   │   ├── lockin
│   │   │   └── LockInScreen.tsx
│   │   ├── forum
│   │   │   └── ForumScreen.tsx
│   │   ├── study-spots
│   │   │   └── StudySpotsScreen.tsx
│   │   ├── rewards
│   │   │   └── RewardsScreen.tsx
│   │   ├── leaderboard
│   │   │   └── LeaderboardScreen.tsx
│   │   ├── profile
│   │   │   └── ProfileScreen.tsx
│   │   └── ConfigureBackendScreen.tsx
│   ├── services
│   │   └── index.ts
│   ├── utils
│   │   ├── profile.ts
│   │   └── validation.ts
│   ├── theme
│   │   ├── colors.ts
│   │   └── index.ts
│   └── types
│       └── env.d.ts
├── convex
│   ├── auth.ts
│   ├── schema.ts
│   ├── queries.ts
│   ├── schoolOptions.ts
│   ├── mutations.ts
│   ├── lockIn.ts
│   ├── studySessions.ts
│   ├── cafe.ts
│   ├── rewards.ts
│   ├── leaderboard.ts
│   ├── forum.ts
│   ├── studySpots.ts
│   └── rules.ts
└── supabase
    ├── schema.sql
    └── migrations
```

## Environment variables

1. Copy `.env.example` to `.env`
2. Fill values:
   - `EXPO_PUBLIC_CONVEX_URL`

Expo exposes variables prefixed with `EXPO_PUBLIC_` to the app runtime.

## Run locally

1. Install Node.js 20+ and npm
2. Install dependencies:
   - `npm install`
3. Start Convex backend dev session (interactive login required once):
   - `npm run convex:dev`
4. In another terminal, start app:
   - `npm run start`
5. Open in iOS simulator, Android emulator, or Expo Go

## Authentication (hackathon-stable)

**Chosen approach: email-only “find or create” in Convex (no password, no email provider).**

- **There is no separate “Sign up” screen** — **Sign in or create account** is one flow: new email creates a user; existing email signs you in.
- **Why:** Full email OTP / magic link adds provider setup and failure modes you do not want in a 2-day hackathon.
- **How:** `auth:signInWithEmail` normalizes email, finds or inserts a `users` row, returns `userId`. The app stores `userId` in **AsyncStorage** and loads `auth:getCurrentUser` on launch.
- **Upgrade path:** Swap the client + Convex layer for **Convex Auth**, **Clerk**, or **Supabase Auth** later; keep `users` as the profile table and replace `signInWithEmail` with token-verified user creation.

**Routing:** `App.tsx` → `ConvexProvider` → `SessionProvider` → `RootNavigator`: unauthenticated users only see **Auth**; signed-in users without `onboarding_completed` see **Onboarding**; then **Main** (tabs, starting at Discover).

### If login fails (“Continue with email” errors)

1. **Run Convex** in a second terminal: `npm run convex:dev` (deploys/syncs functions; required the first time and while developing).
2. **`.env`** must define `EXPO_PUBLIC_CONVEX_URL` to your deployment URL — then **restart Expo** (env is read at bundle time).
3. After schema changes, ensure Convex has finished deploying so `auth:signInWithEmail` and `users` schema match.
4. Check the **red error text** on the auth screen — it now shows the real message from Convex/network when possible.

## Convex setup notes

- Convex functions live in `convex/` (see **Convex backend API** below).
- React Native client is in `src/lib/convex.ts`
- App provider wiring is in `App.tsx`
- Basic smoke test is in `src/screens/profile/ProfileScreen.tsx`
  - query: `queries:getBackendHealth`
  - mutation: `mutations:incrementTestCounter`

### Test café locations (`convex/seed.ts`)

Insert sample rows into `cafe_locations` (Singapore-area coords; safe to re-run — skips rows that already match by **name**):

```bash
npx convex run seed:seedCafeLocations
```

To insert duplicates anyway (not usually needed):

```bash
npx convex run seed:seedCafeLocations '{"forceDuplicateNames": true}'
```

### Auth API (`convex/auth.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `signInWithEmail` | mutation | Find-or-create user by normalized email |
| `completeOnboarding` | mutation | Sets school, course, age, `onboarding_completed: true` |
| `getCurrentUser` | query | Load profile by `userId` |

### School presets (`convex/schoolOptions.ts`)

DE/EU university strings for onboarding alignment. Optional query `getSchoolPresets` returns the same list the app shows in `src/constants/onboardingOptions.ts` — **keep those two in sync** when editing.

## Convex backend API (core logic)

All business rules run in Convex mutations/queries (not in the UI).

### Lock-in (`convex/lockIn.ts` + `convex/rules.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `validateSessionEligibility` | query | Cooldown, night window (local hour via offset), optional group size ≥ 2 |
| `enforceRules` | query | Exposes interval / max session / cooldown / night window constants + snapshot |
| `startStudySession` | mutation | Validates rules, blocks duplicate active session, creates session + participant rows |
| `updateSessionParticipantFlags` | mutation | Client reports foreground / proximity for a participant |
| `completeSession` | mutation | Validates all participants, applies 60m intervals + 4h cap + night window, awards points, sets 2h cooldown if session hit 4h cap |

### Study session lifecycle (`convex/studySessions.ts`)

Container-only session state (no lock-in validation). Use this as the base layer; compose with `lockIn` later (e.g. validate → `startSession` / `endSession`).

| Function | Type | Purpose |
|----------|------|---------|
| `startSession` | mutation | Creates a session for `groupId`; optional `initialStatus` `pending` \| `active` (default `active`). Rejects if the group already has a `pending` or `active` session. |
| `getSession` | query | Load one session by id |
| `getActiveSessionByGroup` | query | Active session for a group, if any |
| `endSession` | mutation | Close `pending` or `active` → `completed` or `failed`; sets `ended_at`, `duration_minutes`, `points_awarded`, `ended_reason` |
| `activateSession` | mutation | `pending` → `active`; refreshes `started_at` for duration |

### Forum (`convex/forum.ts`)

Text-only `forum_posts` plus text `forum_responses` (no likes/nested replies in MVP). Generic CRUD also exists under `crudMutations` / `crudQueries` (`addForumResponse`, `deleteForumResponse`, `listForumResponses`; deleting a post cascades deletes its responses). Product APIs use **Convex Auth** for create/resolve/reply.

| Function | Type | Purpose |
|----------|------|---------|
| `createPost` | mutation | Authenticated author; `title`, `body`, `subject`, optional `scheduledMeetupTime` |
| `createResponse` | mutation | Authenticated user; `postId`, `body` |
| `getPosts` | query | Optional `subject` / `status` filter; sorted by `created_at` desc |
| `getPostById` | query | Single post or `null` |
| `getResponsesForPost` | query | Replies for one thread, oldest first; includes `author_name` when set on `users` |
| `getResponseCounts` | query | `{ [postId]: count }` for a list of post ids |
| `markPostResolved` | mutation | Author-only; sets `status` → `resolved` |
| `seedExampleForumPosts` | mutation | Idempotent: if **`forum_responses` is empty**, inserts **2 demo replies per thread** on the **3 oldest** posts (by `created_at`). If there are **no posts yet**, also inserts **3 demo threads** first. Uses **signed-in user** from the app; from **Convex dashboard** pass `authorId` (a `users` id) — dashboard has no JWT. Once any reply exists, seed returns `responses_already_seeded` (clear `forum_responses` in the dashboard to re-run). |

**UI:** `src/screens/forum/ForumScreen.tsx` lists posts with reply counts, opens a thread modal with replies, and can load samples when signed in.

### Study spots (`convex/studySpots.ts`)

Map/discovery POIs (`study_spots` table). Separate from **`cafe_locations`** (capacity & reservations). Nearby uses Haversine in memory — fine for hackathon dataset sizes.

| Function | Type | Purpose |
|----------|------|---------|
| `getNearbyStudySpots` | query | `lat`, `lng`, optional `limit`, `maxDistanceKm`; returns `spots` with `distanceKm` / `distanceMeters`, sorted nearest-first |
| `getPartnerStudySpots` | query | `is_partner === true`, sorted by name |
| `getStudySpotById` | query | Single spot or `null` |

### Partner café map (`convex/cafeLocations.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `getNearbyCafeLocations` | query | `lat`, `lng`, optional `limit`, `maxDistanceKm`; each café includes `distanceKm`, `distanceMeters`, **`estimatedWalkMinutes`**, resolved **`timezone_offset_minutes`**, **`opens_local_minute`**, **`closes_local_minute`** (defaults **08:00–22:00** local if unset; see `convex/cafeHours.ts`) |

### OSM opening hours sync (`convex/cafeOsmSync.ts` + `convex/cafeOsmApply.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `syncCafeHoursFromOsm` | **action** | Calls **Overpass API** (`overpass-api.de`) for nearby OSM `amenity=cafe\|coffee_shop\|fast_food` with `opening_hours`; picks best match by name score + distance; parses a **simple** subset (`Mo-Su …`, `Mo-Fr …`, `Mo-Sa …`, or first `HH:MM-HH:MM`) via `osmOpeningHours.ts`; patches `opens_local_minute`, `closes_local_minute`, `opening_hours_osm_raw`. **Does not** set `timezone_offset_minutes` (keep correct store offset manually / seed). |

CLI: `npx convex run cafeOsmSync:syncCafeHoursFromOsm '{"cafeId":"<id>"}'` — optional `radiusMeters` (30–500, default 150).

**Note:** Full OSM `opening_hours` syntax (public holidays, seasonal, split shifts) is not parsed. Sunday follows the same stored `opens_local_minute` / `closes_local_minute` window as other days unless you set different hours manually after sync.

### Cafe (`convex/cafe.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `checkCafeAvailability` | query | `available_seats`, `is_full`, `can_transact`, `footfall_metric`, `reduce_margin` (stored on cafe), `margin_reduced_by_footfall` (`computeReduceMarginFromFootfall` in `rules.ts`) |
| `updateCafeMarginFlag` | mutation | Sets `cafe_locations.reduce_margin` from `footfall_metric` vs `FOOTFALL_LOW_THRESHOLD` |
| `createSeatHold` | mutation | 5-minute hold; rejects when `occupied + active holds >= total` (race-safe in one mutation) |
| `quoteTimeBasedReservation` | query | `startTime`, `endTime`, **`bookingNowMs`** → `costEuro` = flat advance (€3/€4/€5) + stay (`H`× rate by total hours: ≤1h €3/h, 1–4h €2.5/h, &gt;4h €1.5/h), **`breakdown`**, etc. |
| `createTimeBasedReservation` | mutation | Same args + optional **`bookingNowMs`** (defaults to `nowMs`); stores **`pricing_booking_now_ms`** for extensions; max **7 days** ahead (`rules.RESERVATION_MAX_ADVANCE_MS`); opening-hours + capacity rules unchanged |
| `extendTimeBasedReservation` | mutation | `reservationId`, `userId`, **`newEndTime`**, `nowMs` — recomputes **full** price for `[start, newEnd)` using stored **`pricing_booking_now_ms`** (same formula as initial quote: flat advance + stay ladder); requires `confirmed`, new end after current end, capacity for widened window |
| `finalizeCouponPurchase` | mutation | Converts hold, increments cafe occupancy, creates reservation + coupon; `margin_reduced` uses stored flag **or** footfall heuristic; competitive-rate → tutor points via shared tutor reward helper |
| `grantTutorPointsReward` | mutation | `tutorId`, `amount`, optional `context` — add points to tutor (generic) |
| `handleTutorCompetitiveRate` | mutation | Same default amount as competitive checkout (`TUTOR_REWARD_POINTS`); scaffold for tests/admin — avoid double-award with `finalizeCouponPurchase` |
| `releaseExpiredSeatHolds` | mutation | Marks expired active holds |
| `verifyCafePresence` | mutation | Marks reservation verified / completed |

**Reservation / hold mutation returns (for UI sync):**

| Mutation | Success payload (highlights) |
|----------|------------------------------|
| `createSeatHold` | `holdId`, `seatHoldId`, `cafeId`, `expiresAt` (hold expiry ms), `remainingSeatsAfterBooking` (free seats **now** after this hold) |
| `createTimeBasedReservation` | `reservationId`, `cafeId`, `startTime`, `expiresAt` (= slot end), `durationHours`, `costEuro` + **`totalCost`**, `overlappingReservations`, **`remainingSeatsAfterBooking`** |
| `extendTimeBasedReservation` | `reservationId`, `endTime`, `expiresAt`, `durationHours`, `costEuro`, **`totalCost`**, **`firstHourBaseEuro`** (= advance flat tier), **`remainingSeatsAfterBooking`** |
| `finalizeCouponPurchase` | `reservationId`, `couponId`, **`seatHoldId`**, **`totalCost`** (= `amountPaid`), **`expiresAt`** (= reservation window end), **`remainingSeatsAfterBooking`** (free seats **now** after checkout), `marginReduced`, `tutorRewarded` |

Failures throw `Error` with `.message` set to codes such as `cafe_full`, `cafe_full_for_slot`, `hold_expired`, etc. The app can use `src/lib/cafeReservationUi.ts` (`getCafeReservationMutationError`, `isCafeFullError`) to branch UI.

### Rewards (`convex/rewards.ts`)

Uses **`users.points_total`** as the balance (same field as lock-in / cafe). Append-only **`points_ledger`** records changes made through these mutations; older flows may still patch `points_total` directly until migrated.

| Function | Type | Purpose |
|----------|------|---------|
| `addPoints` | mutation | Add positive integer points; optional `reason`; writes ledger row |
| `deductPoints` | mutation | Subtract points; throws `insufficient_points` if balance would go negative |
| `getUserPoints` | query | `{ pointsTotal }` or `null` |
| `getAvailableRewards` | query | Active rows from `reward_catalog` (insert catalog docs via dashboard or script) |
| `redeemReward` | mutation | Validates reward active + balance; deducts; creates `reward_redemptions` row; returns `{ ok, ... }` |
| `seedGermanStudentRewardCatalog` | mutation | Idempotent: inserts 13 DE/EU‑themed catalog items (Mensa, Döner, DB/Flix, Lieferando, dm, Kino, etc.) if the catalog is empty — run once from the Convex dashboard |

### Leaderboard (`convex/leaderboard.ts`)

Monthly **UTC** window. Uses **only** completed `study_sessions` (`ended_at` in window, `status === completed`) via `session_participants`. **Does not** rank by `users.points_total`. Metrics: `monthlyPoints` (sum `points_awarded`), `monthlyMinutes` (sum `duration_minutes`), `completedSessions` (count). Rank: points → minutes → session count. See `methodology` on each query.

| Function | Type | Purpose |
|----------|------|---------|
| `getMonthlyLeaderboard` | query | Ranked `entries` (default limit 100, max 500), optional `yearMonth`, `nowMs` |
| `getUserRank` | query | `rank`, `stats`, `totalRankedUsers` for one `userId` |
| `getLeaderboardPreview` | query | Top `limit` (default 10, max 50) |

## Notes

- Legacy Supabase SQL files are kept for reference only and are no longer used by the app runtime.
- Pass `nowMs` and `timezoneOffsetMinutes` from the client for time-based rules; all enforcement still happens server-side.

## Intended build order

1. Auth (email sign-in/up + session restore)
2. Onboarding (school/course/age)
3. Discover (matchmaking list and filters)
4. Lock-In (group timer + guardrail checks)
5. Forum (text-only posts and replies)
6. Study Spots (map + nearby spot directory)
7. Rewards (ledger events and balances)
8. Leaderboard (monthly competition ranking)
9. Profile (account and preferences)


Check 