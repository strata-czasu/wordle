import { serve } from "bun";
import * as v from "valibot";
import { authApi } from "./backend/auth";
import { ApiError } from "./backend/error";
import { gameApi } from "./backend/game";
import { interactionsApi } from "./backend/interactions";
import { socialApi } from "./backend/social";
import env from "./env";
import index from "./frontend/index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/health": () => Response.json({ status: "ok" }),

    // API routes
    ...authApi,
    ...gameApi,
    ...socialApi,

    // Discord interactions endpoint
    ...interactionsApi,
  },

  error(error) {
    if (v.isValiError(error)) {
      return Response.json(
        { message: error.message, issues: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof ApiError) {
      return Response.json(error.json(), { status: error.status });
    }
    throw error;
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },

  hostname: env.HOST ?? "127.0.0.1",
  port: env.PORT ?? 3000,
});

console.log(`Listening on ${server.url}`);
