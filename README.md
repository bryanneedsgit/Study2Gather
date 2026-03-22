# Study2Gather

**Study2Gather** is a cross-platform study companion app built with **Expo (React Native)** and **Convex** as the backend. It helps students find study partners, stay focused with timed “lock-in” sessions, discover cafés and study spots on a map, book tables, earn points and tiers, compete on leaderboards, and participate in a lightweight forum. Optional **Stripe** payments support paid café reservations when configured.

This repository is the full-stack application: the mobile-first UI (iOS, Android, and web via React Native Web), Convex functions and schema, HTTP integrations (including **n8n**), and helper scripts for team Convex deployments.

---

## Table of contents

- [What the app does](#what-the-app-does)
- [Architecture at a glance](#architecture-at-a-glance)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Convex backend](#convex-backend)
- [Team deployments and CLI gotchas](#team-deployments-and-cli-gotchas)
- [Authentication (Convex Auth)](#authentication-convex-auth)
- [Payments (Stripe)](#payments-stripe)
- [HTTP API and external integrations](#http-api-and-external-integrations)
- [Data model overview](#data-model-overview)
- [Convex function modules](#convex-function-modules)
- [Seeding and migrations](#seeding-and-migrations)
- [Feature flows (how pieces connect)](#feature-flows-how-pieces-connect)
- [Development notes](#development-notes)
- [Further documentation](#further-documentation)

---

## What the app does

### User-facing features

| Area | Description |
|------|-------------|
| **Discover** | Surfaces **collaboration recommendations** stored in Convex (often populated by **n8n** via HTTP). Shows suggested peers with school/course context. |
| **Lock-In** | **Solo focus sessions**: earn points from eligible focus time (see [rules](#points-and-lock-in-rules)). Requires a prior **QR + GPS check-in** at a valid venue. |
| **Check-In** | Scan venue QR codes; server validates the payload and **GPS proximity** before granting an active check-in that gates lock-in. |
| **Menu** | Partner **café menus** with pricing tiers (list price, partner rate, coupon discounts) when the backend exposes them. |
| **Forum** | Posts by subject, responses, optional meetup times; open/resolved status. |
| **Study Spots** | Map of **study spots** and **café locations** (native maps + web-specific map component), reservations, and related flows. |
| **Rewards** | **Points catalog** and redemptions; special reward kinds (e.g. scannable **€5 café voucher** via QR). |
| **Leaderboard** | Rankings derived from completed sessions (solo and/or group, per backend logic). |
| **Profile** | Extended user fields (school, course, onboarding, points, tier). |
| **Payments** | Modal **Payment** screen (stack above tabs) for Stripe when keys are set; otherwise some flows fall back to **no payment**. |

### Backend capabilities

- **Real-time queries and mutations** via Convex subscriptions.
- **Convex Auth** with email/password (`@convex-dev/auth`).
- **Stripe PaymentIntents** from a Convex **action** when `STRIPE_SECRET_KEY` is set.
- **HTTP routes** on `*.convex.site` for n8n and tooling (collaboration feed, lock-in data export).

---

## Architecture at a glance

```
┌─────────────────────────────────────────────────────────────┐
│  Expo app (React 19, RN 0.79, RN Web)                        │
│  • React Navigation (stack + bottom tabs + modal Payment)    │
│  • ConvexReactClient + ConvexAuthProvider                   │
│  • Contexts: Session, Lock-In, Reservation/Voucher, Tabs    │
│  • Optional Stripe (native vs web split providers)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket + HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Convex deployment (.convex.cloud + .convex.site HTTP)       │
│  • Schema: users, sessions, cafés, rewards, forum, …        │
│  • Auth, queries, mutations, actions                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Stripe API              n8n / other HTTP clients
```

- If **`EXPO_PUBLIC_CONVEX_URL`** is missing, the app renders **`ConfigureBackendScreen`** instead of the full tree so misconfiguration is obvious during development.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **App** | Expo SDK 53, React 19, React Native 0.79, React Native Web, TypeScript 5.8 |
| **Navigation** | React Navigation 7 (native stack, bottom tabs) |
| **Backend** | Convex 1.34 |
| **Auth** | `@convex-dev/auth` (Password provider), JWT/JWKS via Convex env |
| **Maps** | `react-native-maps` (native), web-specific map components where needed |
| **Payments** | `@stripe/stripe-react-native`, `@stripe/stripe-js` + `@stripe/react-stripe-js` on web |
| **Other** | Expo Camera (QR), Expo Location (GPS), Expo Secure Store, QR rendering (`react-native-qrcode-svg`, `qrcode`) |

---

## Repository layout

| Path | Purpose |
|------|---------|
| **`App.tsx`** | Root providers: Convex Auth, session contexts, Stripe wrapper, navigation; backend gate. |
| **`index.ts`** | Expo entry (`registerRootComponent`). |
| **`src/`** | Application source: screens, navigation, components, hooks, theme, config, lib. |
| **`src/navigation/`** | `RootNavigator` (auth → onboarding → main), `MainAppNavigator` (tabs + Payment modal), `MainTabsNavigator`. |
| **`src/screens/`** | Feature screens: auth, onboarding, discover, lock-in, check-in, menu, forum, study spots, rewards, leaderboard, profile, payments. |
| **`src/context/`** | Session, lock-in session, reservation voucher, tab hover. |
| **`src/lib/`** | Convex client, API re-exports, Stripe config, geo/time helpers. |
| **`convex/`** | Convex schema, functions, HTTP router, auth config. |
| **`convex/_generated/`** | Generated API types and server stubs (do not hand-edit). |
| **`scripts/`** | Node helpers: Convex dev with team deployment, env inspection, auth key generation. |
| **`docs/`** | Deep-dive guides (Convex auth, multi-dev, payments, QR formats, etc.). |
| **`assets/`** | Images and static assets referenced by Expo config. |

Path alias: **`@/*` → `src/*`** (see `tsconfig.json`).

---

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **Expo CLI** usage via `npx` (no global install strictly required)
- A **Convex** account and CLI (`npx convex login`)
- For native features (camera, maps, Stripe wallets): **Xcode** (iOS) / **Android Studio** (Android) when not using Expo Go alone

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Link Convex (development deployment)

From the project root:

```bash
npx convex dev
```

This associates the repo with a Convex project and typically writes deployment info to **`.env.local`**. See [Team deployments](#team-deployments-and-cli-gotchas) if your team shares a specific dev deployment name.

### 3. App environment file

Copy the example env file and set the public Convex URL to match your deployment:

```bash
cp .env.example .env
```

Edit **`.env`** so `EXPO_PUBLIC_CONVEX_URL` points at your deployment’s **Convex URL** (hostname ending in `.convex.cloud`). Set **`EXPO_PUBLIC_CONVEX_SITE_URL`** to your app origin (e.g. `http://localhost:8081` for local Metro web/dev).

### 4. Convex Auth environment (deployment)

Convex Auth requires JWT keys and site URLs on the **same** deployment the app uses. The project includes:

```bash
npm run generate-auth-keys
```

Then set the printed **`JWT_PRIVATE_KEY`** and **`JWKS`** in the Convex dashboard, and set **`SITE_URL`** / **`CONVEX_SITE_URL`** to match **`EXPO_PUBLIC_CONVEX_SITE_URL`**. Step-by-step: **`docs/CONVEX_AUTH.md`**.

### 5. Start Expo with a clean cache (after env changes)

```bash
npx expo start -c
```

In development, watch for the log line:

`[Convex] EXPO_PUBLIC_CONVEX_URL → …`

---

## Environment variables

### Expo / client (`EXPO_PUBLIC_*`)

| Variable | Required | Purpose |
|----------|----------|---------|
| **`EXPO_PUBLIC_CONVEX_URL`** | Yes (for full app) | Convex deployment URL (`https://….convex.cloud`). |
| **`EXPO_PUBLIC_CONVEX_SITE_URL`** | Strongly recommended | Must align with Convex `SITE_URL` / `CONVEX_SITE_URL` for auth (e.g. `http://localhost:8081`). |
| **`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`** | Optional | Stripe publishable key for Payment screen. |
| **`EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER`** | Optional | Apple Pay merchant ID (default `merchant.com.study2gather` in `app.json`). |
| **`EXPO_PUBLIC_STRIPE_MERCHANT_COUNTRY`** | Optional | Default `IE`. |
| **`EXPO_PUBLIC_STRIPE_CURRENCY`** | Optional | Default `eur`. |

`EXPO_PUBLIC_*` values are **embedded at Metro bundle time** — restart **`npx expo start -c`** after changes.

### Convex CLI / linking (files or shell)

| Variable | Purpose |
|----------|---------|
| **`CONVEX_DEPLOYMENT`** | Written by Convex CLI; identifies dev/prod deployment. |
| **`CONVEX_DEPLOY_KEY`** | Deployment deploy key; needed in some multi-deployment setups so `convex dev` targets the correct deployment. |

Use **`npm run env:convex`** to see what is in `.env` / `.env.local` vs your shell (shell wins for the CLI).

### Convex dashboard (server secrets)

| Variable | Purpose |
|----------|---------|
| **`JWT_PRIVATE_KEY`**, **`JWKS`** | Convex Auth token signing (from `generate-auth-keys`). |
| **`SITE_URL`**, **`CONVEX_SITE_URL`** | Auth.js provider domain alignment. |
| **`STRIPE_SECRET_KEY`** | Stripe PaymentIntent creation in `convex/payments.ts`. |

---

## Running the app

| Command | Description |
|---------|-------------|
| **`npm start`** | `expo start` — dev server, QR for Expo Go. |
| **`npm run ios`** | `expo run:ios` — native build/run iOS. |
| **`npm run android`** | `expo run:android` — native build/run Android. |
| **`npm run web`** | `expo start --web` — run in browser. |
| **`npm run typecheck`** | `tsc --noEmit` — TypeScript check. |

---

## Convex backend

### Dev workflow

| Command | Description |
|---------|-------------|
| **`npm run convex:dev`** | Runs `convex dev` with optional **team deployment select** (see `scripts/convexDevWithTeam.mjs`). |
| **`npm run convex:deploy`** | `convex deploy` — production deploy. |
| **`npm run convex:dashboard`** | Opens Convex dashboard for the deployment in `scripts/teamConvexDeployment.json` (passes `--deployment` when configured). |
| **`npm run convex:team`** | `npx convex deployment select` using **`scripts/teamConvexDeployment.json`**. |

### Generated code

After schema or function changes, **`npx convex dev`** regenerates **`convex/_generated/`**. Import **`api`** / **`internal`** from there in Convex code; the React app uses **`@/lib/convexApi`** (re-export) for type-safe references.

### Guidelines

When modifying Convex code, follow **`convex/_generated/ai/guidelines.md`** (project rule) for validators, internal vs public functions, and HTTP actions.

---

## Team deployments and CLI gotchas

- **`scripts/teamConvexDeployment.json`** commits the **canonical deployment name** for this repo (currently **`flippant-mandrill-603`**). Adjust if your team uses a different shared dev deployment.
- Without **`CONVEX_DEPLOY_KEY`**, `convex dev` can still **provision a new random dev deployment** instead of staying on the team’s. **`npm run convex:dev`** warns and runs `convex deployment select` when appropriate.
- Full troubleshooting: **`docs/CONVEX_MULTI_DEV.md`**.
- From-scratch setup checklist: **`docs/CONFIGURE_FROM_SCRATCH.md`**.

---

## Authentication (Convex Auth)

- **Provider**: Password (email; username on sign-up) — see **`convex/auth.ts`**.
- **User table**: Extends Convex Auth **`users`** with app fields (`username`, `school`, `course`, `points`, `tier_status`, onboarding flags, etc.) — see **`convex/schema.ts`**.
- **Client**: `ConvexAuthProvider` with **`convexAuthStorage`** (Secure Store–backed where applicable).
- **Site URL**: `convex/auth.config.ts` uses **`CONVEX_SITE_URL`** for Auth.js domain configuration.

Detailed JWT and dashboard steps: **`docs/CONVEX_AUTH.md`**.

---

## Payments (Stripe)

- **Convex**: `payments.paymentsBackendReady` exposes whether **`STRIPE_SECRET_KEY`** is set; `payments.createPaymentIntent` creates PaymentIntents via Stripe’s REST API.
- **Client**: Native Stripe and web Payment Element are split so **native Stripe is never imported on web** (`StripeOptionalProvider` / `.web.tsx`).
- **Café reservations**: When Stripe is configured, booking can route through **Pay & reserve**; otherwise the app can confirm without payment.

Full tables of env vars and platform notes: **`docs/PAYMENTS.md`**.

---

## HTTP API and external integrations

HTTP actions are served from **`https://<deployment>.convex.site`** (not `.convex.cloud`). See comments in **`convex/http.ts`**.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/get_n8n_data` | JSON export of latest lock-in session rows (via `lockInSessions.getLatestEntries`). |
| GET | `/n8n/collaboration_recommendations` | Latest stored collaboration recommendations. |
| POST | `/n8n/collaboration_recommendations` | Ingest recommendation payloads from **n8n** (normalized and saved via internal mutation). |

Convex Auth **HTTP routes** are also mounted via `auth.addHttpRoutes(http)`.

---

## Data model overview

The schema in **`convex/schema.ts`** is the source of truth. Highlights:

- **`users`**: Profile, gamification (`points`, `tier_status`), cooldowns, timezone offsets.
- **`lock_in_sessions` / `lock_in_reservations` / `lock_in_location_check_ins`**: Solo lock-in lifecycle and **QR/GPS gate**.
- **`study_groups`**, **`study_group_members`**, **`study_sessions`**, **`session_participants`**: Group study sessions and participation.
- **`forum_posts`**, **`forum_responses`**: Forum threads and replies.
- **`study_spots`**, **`cafe_locations`**, **`cafe_menu_items`**, **`cafe_seat_holds`**: Venues, menus, short-lived seat holds.
- **`reservations`**, **`coupon_purchases`**: Café bookings and coupon purchase state machine.
- **`reward_catalog`**, **`reward_redemptions`**, **`points_ledger`**: Rewards and point audit trail.
- **`collaboration_recommendations`**: n8n-fed match data for Discover.

Auth tables from **`authTables`** are included in the same schema.

---

## Convex function modules

The generated API aggregates these modules (see **`convex/_generated/api.d.ts`**):

| Module | Typical concerns |
|--------|------------------|
| **`auth`** | Convex Auth helpers, `getCurrentUser`. |
| **`profile`**, **`sessionUser`** | Profile payloads and session user helpers. |
| **`lockIn`**, **`lockInSolo`**, **`lockInSessions`**, **`lockInReservations`** | Group vs solo lock-in, exports, reservations. |
| **`locationCheckIn`** | QR parsing, GPS validation, active check-in queries. |
| **`studySessions`** | Group session lifecycle. |
| **`studySpots`**, **`cafe`**, **`cafeLocations`**, **`cafeHours`**, **`cafeMenu`**, **`cafeMenuFullMenus`** | Venues, hours, menus, booking-related logic. |
| **`cafeOsmSync`**, **`cafeOsmApply`**, **`osmOpeningHours`** | OSM-related opening hours sync/apply. |
| **`forum`** | Forum CRUD and listing. |
| **`leaderboard`** | Rankings and time windows. |
| **`rewards`**, **`userPoints`** | Points, catalog, redemption. |
| **`rules`** | Shared constants and pricing/points helpers. |
| **`payments`** | Stripe actions. |
| **`collaborationRecommendations`** | Stored recommendations + queries for current user. |
| **`geoUtils`** | Distance / geo helpers. |
| **`seed`** | Dev data and one-off migrations. |
| **`crudQueries`**, **`crudMutations`**, **`queries`**, **`mutations`** | General-purpose or legacy CRUD entry points where present. |
| **`validators`**, **`schoolOptions`** | Shared validators and school lists. |
| **`http`** | HTTP router composition. |

---

## Seeding and migrations

**`convex/seed.ts`** exposes mutations for development and maintenance, including:

- **`seedCafeLocations`** (and related seed helpers) — partner cafés and demo data.
- **`seedN8nFeedData`** — sample collaboration data.
- **`migrateNameToUsername`**, **`removeNameFromUsers`** — user field migrations documented in-file.

Run examples:

```bash
npx convex run seed:seedCafeLocations
```

See file header comments in **`convex/seed.ts`** for the full list and migration order.

---

## Feature flows (how pieces connect)

### Solo lock-in (high level)

1. User completes **check-in** with a valid QR payload and GPS within server radius → row in **`lock_in_location_check_ins`**.
2. User starts **solo lock-in** → **`lockInSolo.startSoloLockIn`** consumes check-in and creates **`lock_in_sessions`**.
3. On completion, points follow **`rules.ts`** (eligible time excludes a configurable local night window; session length caps and cooldowns apply).

QR formats and API table: **`docs/LOCK_IN_QR.md`**.

### Discover / n8n

1. External workflow POSTs to **`/n8n/collaboration_recommendations`** on the Convex **site** URL.
2. Data is stored in **`collaboration_recommendations`** and surfaced to the Discover tab via **`collaborationRecommendations.getRecommendationsForCurrentUser`**.

### Café vouchers / rewards

Reward kinds and QR redemption semantics are documented in **`docs/REWARDS_QR.md`** and **`docs/CAFE_VOUCHERS.md`**.

### Points and lock-in rules

Business rules and pricing helpers live in **`convex/rules.ts`** (e.g. points per eligible second, max session minutes, cooldown after cap, reservation pricing tiers). **Do not** duplicate magic numbers in the client without checking this module.

---

## Development notes

### TypeScript

- **Strict mode** enabled (`tsconfig.json`).
- Use **`npm run typecheck`** before commits or CI.

### Native vs web

- Some screens have **`.web.tsx`** counterparts (e.g. maps, Stripe, QR) to avoid loading native-only modules on web.
- **Stripe**: Native and web implementations are intentionally split; see **`docs/PAYMENTS.md`**.

### Permissions (Expo)

`app.json` configures plugins for **camera** (QR), **location** (venue verification), **Stripe**, etc. Permission strings are user-facing — update if you rebrand or change flows.

### Cleaning up dev deployments

See **`docs/DELETE_DEV_DEPLOYMENT.md`** if you need to remove an accidental Convex dev deployment.

---

## Further documentation

| Document | Topic |
|----------|--------|
| **`docs/CONFIGURE_FROM_SCRATCH.md`** | Full reset → working Convex + Expo |
| **`docs/CONVEX_AUTH.md`** | JWT, site URL, dashboard |
| **`docs/CONVEX_MULTI_DEV.md`** | Wrong deployment, deploy keys |
| **`docs/PAYMENTS.md`** | Stripe env and platform behavior |
| **`docs/LOCK_IN_QR.md`** | QR payload formats and APIs |
| **`docs/REWARDS_QR.md`** | Reward QR redemption |
| **`docs/CAFE_VOUCHERS.md`** | Café voucher flows |

---

## License and contributing

This project is marked **private** in `package.json`. Add a `LICENSE` file and contribution guidelines if you open-source or onboard collaborators.

---

*Generated documentation for the Study2Gather codebase. For Convex product docs, see [convex.dev](https://convex.dev). For Expo, see [docs.expo.dev](https://docs.expo.dev).*
