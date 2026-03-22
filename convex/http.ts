/**
 * HTTP Actions are exposed at https://<deployment>.convex.site (NOT .convex.cloud).
 * E.g. https://flippant-mandrill-603.convex.site/n8n/collaboration_recommendations
 * Find your deployment name in Dashboard → Settings → URL.
 */
import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

// Keep your existing Auth routes
auth.addHttpRoutes(http);

// Route for n8n to fetch lock-in session rows (includes optional `location_id`)
http.route({
  path: "/get_n8n_data",
  method: "GET",
  handler: httpAction(async (ctx, _request) => {
    const data = await ctx.runQuery(api.lockInSessions.getLatestEntries, {});

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  })
});

/**
 * GET /n8n/collaboration_recommendations
 * Fetch stored recommendations (e.g. for app or debugging).
 */
http.route({
  path: "/n8n/collaboration_recommendations",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const data = await ctx.runQuery(api.collaborationRecommendations.getLatest, {
      limit: 50
    });
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  })
});

/**
 * POST /n8n/collaboration_recommendations
 * Expected body: { userMatches: [{ user_id, user_1, user_2, user_3 }], totalUsers?, timestamps? }
 */
http.route({
  path: "/n8n/collaboration_recommendations",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
    let body: {
      userMatches?: Array<{
        user_id?: string;
        userId?: string;
        user_1?: string;
        user_2?: string;
        user_3?: string;
      }>;
      totalUsers?: number;
      timestamps?: number | number[];
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { userMatches, totalUsers, timestamps } = body;
    if (!Array.isArray(userMatches) || userMatches.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid userMatches: must be non-empty array of { user_id, user_1, user_2, user_3 }"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const normalized: Array<{ user_id: string; matches: string[] }> = [];
    for (const u of userMatches) {
      if (typeof u !== "object" || u === null) {
        return new Response(
          JSON.stringify({
            error: "Each userMatches item must have user_id and user_1 (at least)"
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const uid = u.user_id ?? u.userId;
      if (typeof uid !== "string") {
        return new Response(
          JSON.stringify({
            error: "Each userMatches item must have user_id (string)"
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const matches: string[] = [];
      if (typeof u.user_1 === "string") matches.push(u.user_1);
      if (typeof u.user_2 === "string") matches.push(u.user_2);
      if (typeof u.user_3 === "string") matches.push(u.user_3);
      normalized.push({ user_id: uid, matches });
    }
    const ts =
      timestamps !== undefined && timestamps !== null
        ? typeof timestamps === "number"
          ? timestamps
          : Array.isArray(timestamps)
            ? timestamps
            : [Date.now()]
        : [Date.now()];
    await ctx.runMutation(internal.collaborationRecommendations.saveFromN8n, {
      userMatches: normalized,
      totalUsers: typeof totalUsers === "number" ? totalUsers : undefined,
      timestamps: Array.isArray(ts) ? ts : ts
    });
    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  })
});

export default http;
