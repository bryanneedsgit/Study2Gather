#!/usr/bin/env node
/**
 * Appends `--deployment <name>` for Convex commands that support it (dashboard, logs, env, …)
 * when `.env.local` has `CONVEX_DEPLOYMENT=dev:<name>`.
 *
 * Why: If you only set CONVEX_DEPLOYMENT in env, the CLI often uses the "own dev" path and
 * re-provisions the *default* dev deployment for the project — which can be a *different*
 * deployment (e.g. tangible-hedgehog) than the one in CONVEX_DEPLOYMENT (e.g. flippant-mandrill).
 * Passing `--deployment <bare-name>` forces the correct deployment.
 *
 * `convex dev` does NOT support `--deployment` (see `npx convex dev --help`). If `dev` keeps
 * attaching to the wrong backend, remove the extra dev deployment in the Convex dashboard or
 * ask Convex support — same root cause as above.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

/** Team canonical dev deployment (edit scripts/teamConvexDeployment.json). Takes precedence over .env.local so dashboard/env commands aren’t stuck on tangible-hedgehog after `convex dev`. */
function parseTeamDeploymentName() {
  const p = resolve(process.cwd(), "scripts", "teamConvexDeployment.json");
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf8"));
    const name = raw.deploymentName;
    return typeof name === "string" && name.length > 0 ? name.trim() : null;
  } catch {
    return null;
  }
}

function parseDeploymentNameFromEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return null;
  const text = readFileSync(p, "utf8");
  const m = text.match(/^\s*CONVEX_DEPLOYMENT\s*=\s*dev:([^\s#]+)/m);
  return m ? m[1].trim() : null;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: node scripts/runConvexWithDeployment.mjs <convex subcommand> [extra args...]\n" +
      "Example: node scripts/runConvexWithDeployment.mjs dashboard",
  );
  process.exit(1);
}

const teamDeployment = parseTeamDeploymentName();
const envLocalDeployment = parseDeploymentNameFromEnvLocal();
const deployment = teamDeployment ?? envLocalDeployment;
const hasDeploymentFlag = args.includes("--deployment");

if (args[0] === "dev" && deployment && !hasDeploymentFlag) {
  console.warn(
    `[convex] Note: \`convex dev\` has no --deployment flag. If dev keeps using the wrong ` +
      `deployment despite CONVEX_DEPLOYMENT in .env.local, your project may have multiple dev ` +
      `deployments and the CLI re-provisions the default one. After \`convex dev\`, run ` +
      `\`npm run convex:team\` to switch to the deployment in scripts/teamConvexDeployment.json.\n`,
  );
}

const convexArgs = [...args];
if (deployment && !hasDeploymentFlag) {
  if (teamDeployment && envLocalDeployment && teamDeployment !== envLocalDeployment) {
    console.warn(
      `[convex] Using scripts/teamConvexDeployment.json → --deployment ${teamDeployment} ` +
        `(overrides .env.local ${envLocalDeployment} for this command).\n`,
    );
  }
  convexArgs.push("--deployment", deployment);
}

const result = spawnSync("npx", ["convex", ...convexArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
