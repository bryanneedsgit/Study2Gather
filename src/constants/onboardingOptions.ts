/**
 * Onboarding dropdown presets — German / EU universities (hackathon defaults).
 * Keep school list in sync with `convex/schoolOptions.ts` `SCHOOL_PRESET_OPTIONS` + "Other".
 */
export const SCHOOL_OPTIONS = [
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
  "Humboldt-Universität zu Berlin",
  "Other"
] as const;

/** Course / major style labels common in DE/EU programmes */
export const COURSE_OPTIONS = [
  "Informatik / Computer Science",
  "Wirtschaftswissenschaften / Business",
  "Maschinenbau / Mechanical Engineering",
  "Medizin / Medicine",
  "Physik / Physics",
  "Other"
] as const;

export type SchoolOption = (typeof SCHOOL_OPTIONS)[number];
export type CourseOption = (typeof COURSE_OPTIONS)[number];
