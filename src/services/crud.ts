/**
 * CRUD function references for Convex — use with `useQuery` / `useMutation` from `convex/react`,
 * or with the hooks in `@/hooks/useConvexCrud`.
 */
import { api } from "@/lib/convexApi";

export const crudQueries = api.crudQueries;
export const crudMutations = api.crudMutations;

/** Full generated API (auth, cafe, lockIn, queries, mutations, …) */
export { api };
