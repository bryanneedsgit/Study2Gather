#!/usr/bin/env node
/**
 * Shows which Convex-related values are in .env / .env.local vs your shell.
 * Shell vars win for Convex CLI (dotenv does not override existing env).
 * EXPO_PUBLIC_* is baked in when Metro starts — restart with `npx expo start -c` after changes.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function parseEnv(content) {
  const out = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const root = process.cwd();
const keys = [
  "EXPO_PUBLIC_CONVEX_URL",
  "EXPO_PUBLIC_CONVEX_SITE_URL",
  "CONVEX_DEPLOYMENT",
  "CONVEX_DEPLOY_KEY",
];

let merged = {};
for (const name of [".env", ".env.local"]) {
  const p = resolve(root, name);
  if (!existsSync(p)) continue;
  const parsed = parseEnv(readFileSync(p, "utf8"));
  merged = { ...merged, ...parsed };
  console.log(`\n--- ${name} ---`);
  for (const k of keys) {
    if (parsed[k] != null) {
      if (k === "CONVEX_DEPLOY_KEY") {
        console.log(`${k}=(set, hidden)`);
      } else {
        console.log(`${k}=${parsed[k]}`);
      }
    }
  }
}

console.log("\n--- Effective from files (.env then .env.local) ---");
for (const k of keys) {
  if (merged[k] != null) {
    if (k === "CONVEX_DEPLOY_KEY") {
      console.log(`${k}=(set, hidden)`);
    } else {
      console.log(`${k}=${merged[k]}`);
    }
  }
}

console.log("\n--- Your shell right now (CLI uses these if set — overrides files!) ---");
for (const k of keys) {
  const v = process.env[k];
  if (v) {
    if (k === "CONVEX_DEPLOY_KEY") {
      console.log(`${k}=(set, hidden) ← removes file-based deployment choice`);
    } else {
      console.log(`${k}=${v}`);
    }
  } else {
    console.log(`${k}=(unset)`);
  }
}

console.log(`
Tips:
  • If CONVEX_DEPLOYMENT or CONVEX_DEPLOY_KEY shows above in the shell, run:
      unset CONVEX_DEPLOYMENT CONVEX_DEPLOY_KEY
    then open a NEW terminal and run \`npx convex deployment select flippant-mandrill-603\`.
  • If \`npx convex dashboard\` opens the WRONG deployment but .env.local is correct: the CLI
    often ignores the specific deployment name unless you pass --deployment. Use:
      npm run convex:dashboard
    or: npx convex dashboard --deployment YOUR-BARE-DEPLOYMENT-NAME
  • For the Expo app, after fixing .env files, restart Metro with a clean cache:
      npx expo start -c
  • Check the Metro console for: [Convex] EXPO_PUBLIC_CONVEX_URL → …
`);
