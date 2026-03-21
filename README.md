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

### Study spots (`convex/studySpots.ts`)

Map/discovery POIs (`study_spots` table). Separate from **`cafe_locations`** (capacity & reservations). Nearby uses Haversine in memory — fine for hackathon dataset sizes.

| Function | Type | Purpose |
|----------|------|---------|
| `getNearbyStudySpots` | query | `lat`, `lng`, optional `limit`, `maxDistanceKm`; returns `spots` with `distanceKm` / `distanceMeters`, sorted nearest-first |
| `getPartnerStudySpots` | query | `is_partner === true`, sorted by name |
| `getStudySpotById` | query | Single spot or `null` |

### Cafe (`convex/cafe.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `checkCafeAvailability` | query | `available_seats`, `is_full`, `can_transact`, `footfall_metric`, `reduce_margin` (stored on cafe), `margin_reduced_by_footfall` (`computeReduceMarginFromFootfall` in `rules.ts`) |
| `updateCafeMarginFlag` | mutation | Sets `cafe_locations.reduce_margin` from `footfall_metric` vs `FOOTFALL_LOW_THRESHOLD` |
| `createSeatHold` | mutation | 5-minute hold; rejects when `occupied + active holds >= total` (race-safe in one mutation) |
| `finalizeCouponPurchase` | mutation | Converts hold, increments cafe occupancy, creates reservation + coupon; `margin_reduced` uses stored flag **or** footfall heuristic; competitive-rate → tutor points via shared tutor reward helper |
| `grantTutorPointsReward` | mutation | `tutorId`, `amount`, optional `context` — add points to tutor (generic) |
| `handleTutorCompetitiveRate` | mutation | Same default amount as competitive checkout (`TUTOR_REWARD_POINTS`); scaffold for tests/admin — avoid double-award with `finalizeCouponPurchase` |
| `releaseExpiredSeatHolds` | mutation | Marks expired active holds |
| `verifyCafePresence` | mutation | Marks reservation verified / completed |

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
5. Forum (text-only posts/comments)
6. Study Spots (map + nearby spot directory)
7. Rewards (ledger events and balances)
8. Leaderboard (monthly competition ranking)
9. Profile (account and preferences)


Check 