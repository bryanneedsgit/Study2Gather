#!/usr/bin/env node
/**
 * Runs `npx convex deployment select <deploymentName>` using scripts/teamConvexDeployment.json.
 * Run this after `npx convex dev` if the CLI provisioned the wrong default dev (e.g. tangible-hedgehog).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

const configPath = resolve(
  process.cwd(),
  "scripts",
  "teamConvexDeployment.json",
);
if (!existsSync(configPath)) {
  console.error("Missing scripts/teamConvexDeployment.json");
  process.exit(1);
}
const raw = JSON.parse(readFileSync(configPath, "utf8"));
const name = raw.deploymentName;
if (!name || typeof name !== "string") {
  console.error("scripts/teamConvexDeployment.json: missing string deploymentName");
  process.exit(1);
}

console.log(`Selecting Convex deployment: ${name}\n`);
const result = spawnSync(
  "npx",
  ["convex", "deployment", "select", name],
  { stdio: "inherit", shell: process.platform === "win32", env: process.env },
);
process.exit(result.status === null ? 1 : result.status);
