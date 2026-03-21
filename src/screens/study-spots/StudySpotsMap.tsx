/**
 * Metro picks `StudySpotsMap.web.tsx` (web) or `StudySpotsMap.native.tsx` (iOS/Android).
 * This file exists so TypeScript can resolve `./StudySpotsMap` — it is not used when platform files exist.
 */
export { default } from "./StudySpotsMap.native";
