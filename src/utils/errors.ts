/**
 * Surface Convex / network errors in the UI (mutations often throw ConvexError).
 */
export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return error.message || "Unknown error";
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Something went wrong.";
  }
}
