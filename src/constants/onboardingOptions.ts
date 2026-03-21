/** Mock options for fast hackathon UX; "Other" opens free text. */
export const SCHOOL_OPTIONS = ["NUS", "NTU", "SMU", "Other"] as const;
export const COURSE_OPTIONS = ["CS101", "Data Structures", "Calculus", "Physics I", "Other"] as const;

export type SchoolOption = (typeof SCHOOL_OPTIONS)[number];
export type CourseOption = (typeof COURSE_OPTIONS)[number];
