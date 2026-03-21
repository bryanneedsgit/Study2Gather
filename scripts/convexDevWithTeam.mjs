#!/usr/bin/env node
/**
 * Runs `npx convex dev` with optional `deployment select` first.
 *
 * Without CONVEX_DEPLOY_KEY for your target deployment, `convex dev` can still
 * **provision a brand-new dev deployment** (random name like determined-cod-635)
 * even after `deployment select`. See docs/CONVEX_MULTI_DEV.md — add a deployment
 * deploy key for flippant to stop that.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

function readTeamName() {
  const p = resolve(process.cwd(), "scripts", "teamConvexDeployment.json");
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    return typeof raw.deploymentName === "string" ? raw.deploymentName.trim() : null;
  } catch {
    return null;
  }
}

function envLocalHasDeployKey() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return false;
  const t = readFileSync(p, "utf8");
  return /^\s*CONVEX_DEPLOY_KEY\s*=/m.test(t);
}

const team = readTeamName();
const hasKey = envLocalHasDeployKey();

if (team && !hasKey) {
  console.warn(`
[Convex] Without CONVEX_DEPLOY_KEY, \`convex dev\` may provision a NEW random dev
  (e.g. determined-cod-635) instead of staying on ${team}.

  Fix: Dashboard → that deployment → Deploy key → add to .env.local:
    CONVEX_DEPLOY_KEY='dev:${team}|…'
  → docs/CONVEX_MULTI_DEV.md
`);
  console.log(`[convex] Selecting ${team} before dev (updates .env.local)…\n`);
  const sel = spawnSync("npx", ["convex", "deployment", "select", team], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (sel.status !== 0) {
    process.exit(sel.status === null ? 1 : sel.status);
  }
  console.log("");
}

const result = spawnSync("npx", ["convex", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
