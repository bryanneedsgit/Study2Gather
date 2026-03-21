# Why `convex dev` ignores flippant or creates random devs (e.g. `determined-cod-635`)

Your Convex **project** (`study2gather-app`) can have **more than one cloud dev deployment**. The CLI command `npx convex dev` does **not** reliably “stick to” **flippant** from `CONVEX_DEPLOYMENT` / `deployment select` — it can call **provision / authorize for the project**, which creates or returns **another** dev deployment:

- Wrong **existing** one (e.g. **tangible-hedgehog-770**), or  
- A **brand-new** one with a random animal name (e.g. **determined-cod-635**, **shocking-seal-712**).

So **`npm run convex:team`** updates **`.env.local`**, but the **next `npx convex dev`** can still **push to a different deployment** or **provision a new one** unless you lock the CLI with a **deployment deploy key** (below).

## Fix options (pick one)

### 1. Use a **deployment** deploy key for flippant (recommended for teams)

This makes the CLI use **one specific deployment** (flippant), not “provision default dev”.

1. Open the [Convex dashboard](https://dashboard.convex.dev) → select deployment **flippant-mandrill-603** (not tangible).
2. **Settings** → find **Deploy keys** / **Developer** deploy key for **this deployment** (wording may vary).
3. Copy the key and add to **`.env.local`** (never commit this file):

   ```bash
   CONVEX_DEPLOY_KEY='dev:flippant-mandrill-603|…your-key…'
   ```

4. Restart **`npx convex dev`**. The CLI should prefer the deploy key and target **flippant** only.

Remove `CONVEX_DEPLOY_KEY` when you no longer need a fixed deployment.

### 2. Remove the extra dev deployment (only if the team agrees)

In the dashboard, if **tangible-hedgehog-770** is unused and safe to delete, removing it can leave **flippant** as the only dev deployment so provision points at the right place. **Coordinate with teammates** before deleting.

Step-by-step: **`docs/DELETE_DEV_DEPLOYMENT.md`**

### 3. Convex CLI behavior

This is a known sharp edge when multiple dev deployments exist under one project. Using a **deployment-scoped deploy key** (option 1) is the reliable workaround until/unless the CLI changes.
