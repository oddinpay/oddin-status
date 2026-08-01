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
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as incidents from "../incidents.js";
import type * as schedules from "../schedules.js";
import type * as site from "../site.js";
import type * as status from "../status.js";
import type * as subscribers from "../subscribers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  http: typeof http;
  incidents: typeof incidents;
  schedules: typeof schedules;
  site: typeof site;
  status: typeof status;
  subscribers: typeof subscribers;
  users: typeof users;
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

export declare const components: {
  subscriberCount: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"subscriberCount">;
  monitorCount: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"monitorCount">;
  scheduleCount: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"scheduleCount">;
  incidentCount: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"incidentCount">;
};
