/**
 * Generates RS256 key pair for Convex Auth JWT signing.
 * Paste the output into your Convex deployment → Settings → Environment variables:
 *   JWT_PRIVATE_KEY  (single line)
 *   JWKS             (JSON, one line)
 *
 * Usage: node scripts/generateConvexAuthKeys.mjs
 */
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256", { extractable: true });
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log("Add these to Convex Dashboard → Environment variables:\n");
console.log(
  `JWT_PRIVATE_KEY="${privateKey.trimEnd().replace(/\n/g, " ")}"`
);
console.log("");
console.log(`JWKS=${jwks}`);
console.log("");
console.log("Also set both (same URL), e.g.:");
console.log("  npx convex env set SITE_URL http://localhost:8081");
console.log("  npx convex env set CONVEX_SITE_URL http://localhost:8081");
