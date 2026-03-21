# Delete an extra dev deployment (e.g. tangible-hedgehog)

Convex **CLI cannot delete deployments** from this project — use the **dashboard**.

## Steps

1. Open **[dashboard.convex.dev](https://dashboard.convex.dev)** and select your **team** and **project** (e.g. **study2gather-app**).
2. Open **Deployments** (or the deployment list for the project).
3. Select deployment **`tangible-hedgehog-770`** (or the one you no longer need).
4. Use **Settings** / **Danger zone** / **Delete deployment** (wording may vary slightly).

**Before you delete:** confirm with teammates that **no one** still uses that URL and that **flippant-mandrill-603** has everything you need (data, env vars, auth keys).

## After deletion

**Do not rely on `npx convex dev` alone** to pick **flippant** — it can **provision a brand‑new** dev deployment (e.g. `shocking-seal-712`) instead of using your team’s existing one.

1. **Select the deployment you want first:**

   ```bash
   npm run convex:team
   ```

   (or `npx convex deployment select flippant-mandrill-603` — bare name, see `docs/CONVEX_AUTH.md`.)

2. Then run **`npm run convex:dev`** (or `npx convex dev`). That way `.env.local` points at **flippant**, not a newly provisioned deployment.

3. If a stray deployment was created (e.g. shocking-seal), delete it in the dashboard **only if unused**, same as above.

4. Align **`.env`** with **`.env.local`** and restart Expo with **`npx expo start -c`**.
