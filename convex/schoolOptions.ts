/**
 * German / EU university presets (onboarding + any server-side helpers).
 * Keep in sync with `src/constants/onboardingOptions.ts` (SCHOOL_OPTIONS without trailing "Other"
 * is the same ordered list as `SCHOOL_PRESET_OPTIONS` below; client adds "Other" for free text).
 */
import { queryGeneric } from "convex/server";
import { v } from "convex/values";

export const SCHOOL_PRESET_OPTIONS = [
  "TUM",
  "ETH Zürich",
  "RWTH Aachen",
  "LMU Munich",
  "TU Berlin",
  "University of Vienna",
  "KU Leuven",
  "University of Amsterdam",
  "TU Delft",
  "EPFL",
  "Sciences Po",
  "University of Copenhagen",
  "KIT Karlsruhe",
  "Humboldt-Universität zu Berlin"
] as const;

/** Optional: client can load presets from the backend instead of bundling constants. */
export const getSchoolPresets = queryGeneric({
  args: {},
  handler: async () => {
    return {
      schools: [...SCHOOL_PRESET_OPTIONS],
      note: "Use with onboarding; users may still submit any string via Other."
    };
  }
});
