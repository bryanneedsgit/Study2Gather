/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cafe from "../cafe.js";
import type * as crudMutations from "../crudMutations.js";
import type * as crudQueries from "../crudQueries.js";
import type * as http from "../http.js";
import type * as lockIn from "../lockIn.js";
import type * as lockInSolo from "../lockInSolo.js";
import type * as mutations from "../mutations.js";
import type * as profile from "../profile.js";
import type * as queries from "../queries.js";
import type * as rules from "../rules.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cafe: typeof cafe;
  crudMutations: typeof crudMutations;
  crudQueries: typeof crudQueries;
  http: typeof http;
  lockIn: typeof lockIn;
  lockInSolo: typeof lockInSolo;
  mutations: typeof mutations;
  profile: typeof profile;
  queries: typeof queries;
  rules: typeof rules;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
