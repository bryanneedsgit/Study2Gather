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
│   │   └── PlaceholderScreen.tsx
│   ├── config
│   │   └── env.ts
│   ├── hooks
│   │   └── useAppTheme.ts
│   ├── lib
│   │   └── convex.ts
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
│   │   └── profile
│   │       └── ProfileScreen.tsx
│   ├── services
│   │   ├── authService.ts
│   │   └── index.ts
│   ├── theme
│   │   ├── colors.ts
│   │   └── index.ts
│   └── types
│       └── env.d.ts
├── convex
│   ├── schema.ts
│   ├── queries.ts
│   └── mutations.ts
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

## Convex setup notes

- Convex functions live in `convex/` (see **Convex backend API** below).
- React Native client is in `src/lib/convex.ts`
- App provider wiring is in `App.tsx`
- Basic smoke test is in `src/screens/profile/ProfileScreen.tsx`
  - query: `queries:getBackendHealth`
  - mutation: `mutations:incrementTestCounter`

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

### Cafe (`convex/cafe.ts`)

| Function | Type | Purpose |
|----------|------|---------|
| `checkCafeAvailability` | query | `available_seats`, `can_transact`, `reduce_margin` (footfall vs threshold) |
| `createSeatHold` | mutation | 5-minute hold; rejects when `occupied + active holds >= total` (race-safe in one mutation) |
| `finalizeCouponPurchase` | mutation | Converts hold, increments cafe occupancy, creates reservation + coupon, optional tutor points |
| `releaseExpiredSeatHolds` | mutation | Marks expired active holds |
| `verifyCafePresence` | mutation | Marks reservation verified / completed |

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