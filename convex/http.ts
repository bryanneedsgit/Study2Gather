import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

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
        "Access-Control-Allow-Origin": "*", // Allows n8n to call it
      },
    });
  }),
});

export default http;
