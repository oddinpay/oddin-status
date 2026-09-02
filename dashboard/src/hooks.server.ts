// src/hooks.server.ts
import { sequence } from "@sveltejs/kit/hooks";
import { error, redirect, type Handle } from "@sveltejs/kit";
import { dev } from "$app/environment";
import {
  createConvexAuthHooks,
  createRouteMatcher,
} from "@mmailaender/convex-auth-svelte/sveltekit/server";

const isProtectedRoute = createRouteMatcher([
  "/connect",
  "/monitors",
  "/incidents",
  "/schedule",
  "/alerts",
]);

const { handleAuth, isAuthenticated } = createConvexAuthHooks({
  cookieConfig: {
    maxAge: 60 * 60 * 24 * 7,
  },
});

const handleDevTools: Handle = async ({ event, resolve }) => {
  if (
    dev &&
    event.url.pathname === "/.well-known/appspecific/com.chrome.devtools.json"
  ) {
    return new Response(undefined, { status: 404 });
  }
  return resolve(event);
};

export const protectRoutes: Handle = async ({ event, resolve }) => {
  const pathname = event.url.pathname;

  if (isProtectedRoute(pathname)) {
    let isAuthed = false;

    try {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("TIMEOUT")), 5000);
      });

      isAuthed = await Promise.race([isAuthenticated(event), timeout]);
    } catch (err) {
      throw error(
        503,
        "Network connection too slow to verify session. Please refresh.",
      );
    }

    if (!isAuthed) {
      throw redirect(303, `/`);
    }
  }

  const response = await resolve(event);

  response.headers.set(
    "Content-Security-Policy",
    `form-action 'self'; frame-ancestors 'self'; base-uri 'self'; upgrade-insecure-requests; object-src 'none'; img-src 'self' https://lh3.googleusercontent.com;`,
  );

  return response;
};

export const handle = sequence(handleAuth, protectRoutes, handleDevTools);
