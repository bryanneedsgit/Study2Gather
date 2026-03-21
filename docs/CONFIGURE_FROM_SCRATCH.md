# Configure Convex + Expo from scratch

Use this after a local “reset” (no `.env.local`, placeholder `.env`, no `.expo/`).

## 1. Dependencies

```bash
npm install
```

## 2. Convex (pick one flow)

**Log in:**

```bash
npx convex login
```

**Link this repo to a dev deployment** (CLI will create/update `.env.local`):

```bash
npx convex dev
```

Choose your **team + project**, then let it finish. It writes `CONVEX_DEPLOYMENT` and `EXPO_PUBLIC_*` into `.env.local`.

**Important:** `convex dev` often **provisions the default dev deployment** for that project (e.g. **tangible-hedgehog**). If your team uses a **shared** dev deployment (e.g. **flippant-mandrill**), switch after `convex dev`:

```bash
npm run convex:team
```

That runs `npx convex deployment select` using **`scripts/teamConvexDeployment.json`** (commit that name for the whole team). It rewrites `.env.local` to the correct deployment.

**Dashboard:** `npm run convex:dashboard` always passes `--deployment` from `teamConvexDeployment.json` when set, so it opens **flippant** even if `.env.local` still says tangible.

See also `docs/CONVEX_AUTH.md` (`npx convex dashboard --deployment YOUR-BARE-NAME`).

If **`npm run convex:dev`** (or `npx convex dev`) still **pushes to tangible** instead of flippant, read **`docs/CONVEX_MULTI_DEV.md`** — `CONVEX_DEPLOYMENT` / `convex:team` are not enough; you likely need a **`CONVEX_DEPLOY_KEY`** for flippant or to remove the extra dev deployment.

## 3. App env

Copy placeholders and fill the URL Convex printed (or from Dashboard → Settings):

```bash
cp .env.example .env
# Edit .env: set EXPO_PUBLIC_CONVEX_URL / EXPO_PUBLIC_CONVEX_SITE_URL to match .env.local and Convex env SITE_URL / CONVEX_SITE_URL
```

Usually **`EXPO_PUBLIC_CONVEX_SITE_URL`** = `http://localhost:8081` for local Metro (same as Convex `CONVEX_SITE_URL` / `SITE_URL`).

## 4. Convex Auth env (deployment)

On the **same** deployment the app uses, set JWT + site URL (see `docs/CONVEX_AUTH.md`):

```bash
npm run generate-auth-keys
npx convex env set SITE_URL http://localhost:8081
npx convex env set CONVEX_SITE_URL http://localhost:8081
# paste JWT_PRIVATE_KEY / JWKS from generate-auth-keys output
```

## 5. Expo

Clear Metro cache so `EXPO_PUBLIC_*` reload:

```bash
npx expo start -c
```

Confirm the log line: `[Convex] EXPO_PUBLIC_CONVEX_URL → …`

## 6. Sanity checks

```bash
npm run env:convex
```

Should show matching URLs in files; shell should not override `CONVEX_DEPLOYMENT` (see `docs/CONVEX_AUTH.md`).
