# Convex Auth (email + password)

This app uses [`@convex-dev/auth`](https://labs.convex.dev/auth) with the **Password** provider and a custom `users` table (see `convex/schema.ts`).

## One-time: JWT keys (required)

Convex Auth signs sessions with RS256. Generate keys and add them to your **Convex deployment** (Dashboard → Settings → Environment variables):

```bash
npm run generate-auth-keys
```

Copy the printed `JWT_PRIVATE_KEY` and `JWKS` values into the dashboard.

## Switch CLI + app to your team’s deployment (e.g. flippant-mandrill)

If teammates use **`https://….convex.cloud`** and your machine was linked to another deployment:

1. **Convex access** — In the [Convex dashboard](https://dashboard.convex.dev), open the **team + project** that owns that URL. Ask a teammate to invite you if you don’t see it.
2. **Point the CLI at that dev deployment** (pick one):
   - Run **`npx convex dev`** and when prompted, **choose the same project** your team uses; or
   - Run **`npx convex deployment select YOUR-DEPLOYMENT-NAME`** using the **hostname only** (e.g. **`flippant-mandrill-603`**). **Do not** use `dev:flippant-mandrill-603` — the CLI parses `dev:…` as “project slug `dev`”, which triggers a bogus “no access” error. For team/project forms, see **`npx convex deployment select --help`**.
   - If you see **“You don't have access to the selected project”**, a teammate must **invite your Convex account** to that team/project in the dashboard; then run **`npx convex dev`** again and pick it.
3. **Sync `.env.local`** — **`npx convex dev`** and **`npx convex deployment select`** **rewrite** `.env.local` to match the deployment the CLI is using. Editing that file by hand is overwritten the next time you run those commands if the CLI is still linked to a different project (e.g. tangible-hedgehog). Fix the linked deployment first; then the file will stay on flippant-mandrill (or whatever you selected). Ensure **`EXPO_PUBLIC_CONVEX_URL`** matches the team URL (no second project in another file).

4. **Shell env beats `.env.local`** — If **`CONVEX_DEPLOYMENT`** is set in your **terminal** (exported in `~/.zshrc`, Cursor task env, CI, etc.), **dotenv will not override it**. Then **`npx convex dashboard`** and **`npx convex dev`** can keep using the **old** deployment (e.g. tangible-hedgehog) and **`convex dev` will write that back into `.env.local`**, undoing `deployment select`. Run **`echo $CONVEX_DEPLOYMENT`** — if it prints a value, run **`unset CONVEX_DEPLOYMENT`** (or remove it from your shell profile), then **`npx convex deployment select flippant-mandrill-603`** again and use **`npx convex dev`** in that same shell.

   **`CONVEX_DEPLOY_KEY`** (project or deployment key) **takes precedence over `CONVEX_DEPLOYMENT`** for the CLI. If you ever set a deploy key for the wrong project, **`unset CONVEX_DEPLOY_KEY`**. Run **`npm run env:convex`** to see what’s in files vs your shell.

5. **Expo still hits the wrong backend** — **`EXPO_PUBLIC_*` is inlined when Metro starts.** After changing `.env` / `.env.local`, run **`npx expo start -c`** and confirm the Metro log line **`[Convex] EXPO_PUBLIC_CONVEX_URL → …`** matches flippant-mandrill (not tangible-hedgehog).
6. **Expo overrides** — If you have both **`.env`** and **`.env.local`**, duplicate keys use **`.env.local` last**. Don’t leave an old **`EXPO_PUBLIC_CONVEX_URL`** in `.env.local` or the app will hit the wrong backend.
7. **Deploy + env on that deployment** — Run **`npx convex dev`** so functions match the repo. On **that** deployment, set **`JWT_PRIVATE_KEY`**, **`JWKS`**, **`SITE_URL`**, and **`CONVEX_SITE_URL`** (same values the team uses; ask them or copy from Dashboard → **Settings → Environment variables**).

## `npx convex dashboard` opens tangible-hedgehog but `.env.local` says flippant-mandrill

This is **not** a bad `.env` or shell env in your case. **`CONVEX_DEPLOYMENT=dev:…` alone** often makes the CLI use an **“own dev”** code path that **re-provisions / resolves the default dev deployment** for your Convex **project**. If that project has **another** dev deployment (e.g. **tangible-hedgehog-770**), the dashboard URL can point there instead of **flippant-mandrill-603**, even though your file lists flippant.

**Fix (dashboard, logs, etc.):** pass the **bare deployment name** (same as in the URL hostname):

```bash
npx convex dashboard --deployment flippant-mandrill-603
```

Or use the repo helper (reads `CONVEX_DEPLOYMENT` from `.env.local` and appends `--deployment` for you):

```bash
npm run convex:dashboard
```

**`convex dev`** does **not** support `--deployment` in current CLI (`npx convex dev --help`). If **`npx convex dev`** still syncs to the wrong dev deployment, **remove the extra dev deployment** you don’t need in the Convex **dashboard** (same project), or keep only one team dev deployment, so the default provisioned target matches flippant.

## Same Convex project everywhere (CLI, dashboard, app)

If **`EXPO_PUBLIC_CONVEX_URL`** in `.env` points at a **different** hostname than the deployment the CLI uses, your app and your backend are **not** the same deployment.

- **CLI / dashboard** — use **`CONVEX_DEPLOYMENT`** in **`.env.local`** *and* **`--deployment`** for commands that support it when multiple dev deployments exist (see above).
- **Expo** loads `.env` and then **`.env.local` overrides** for duplicate keys — but two different URLs in two files is easy to get wrong.

**Fix:** pick one deployment and align everything:

1. Set **`EXPO_PUBLIC_CONVEX_URL`** to the **same** `https://….convex.cloud` URL as the project the CLI uses (Dashboard → **Settings** shows the deployment URL, or copy from `npx convex dev` output).
2. Remove or update the stale URL in whichever file still has the old hostname.
3. Set auth env vars (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`, `CONVEX_SITE_URL`) on **that** deployment only.

## Site URL (required for JWTs)

Convex Auth’s server code uses **`CONVEX_SITE_URL`** as the JWT issuer (`requireEnv("CONVEX_SITE_URL")`). Setting only `SITE_URL` is **not** enough — set **both** to your app origin (same value):

```bash
npx convex env set SITE_URL http://localhost:8081
npx convex env set CONVEX_SITE_URL http://localhost:8081
```

Adjust the port if Metro uses something other than `8081`. For production, use your real `https://…` domain.

In `.env` / `.env.local`, keep **`EXPO_PUBLIC_CONVEX_SITE_URL`** the same as `CONVEX_SITE_URL` so the client matches the issuer.

## Deploy functions

```bash
npm run convex:dev
```

## What changed in the app

- `ConvexAuthProvider` + secure token storage (`src/lib/convexAuthStorage.ts`).
- Sign-in UI: email + password, sign-in vs sign-up (`AuthScreen`).
- `SessionContext` uses `api.profile.getCurrentUser` (backed by `getAuthUserId` on the server).
- Legacy **AsyncStorage user id** flow was removed.

## Existing database

If you had old `users` rows from the passwordless demo, you may need to **clear auth-related tables** in the Convex dashboard or reset the dev deployment before the new schema works cleanly.
