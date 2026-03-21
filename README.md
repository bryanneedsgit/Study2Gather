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

- Convex functions live in `convex/`:
  - `schema.ts`
  - `queries.ts`
  - `mutations.ts`
- React Native client is in `src/lib/convex.ts`
- App provider wiring is in `App.tsx`
- Basic smoke test is in `src/screens/profile/ProfileScreen.tsx`
  - query: `queries:getBackendHealth`
  - mutation: `mutations:incrementTestCounter`

## Notes

- Legacy Supabase SQL files are kept for reference only and are no longer used by the app runtime.
- This foundation intentionally keeps backend setup minimal; feature logic comes in later prompts.

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
>>>>>>> 8a685337 (first commit)
