import { env } from "$env/dynamic/private";
import type { RequestHandler } from "@sveltejs/kit";
import { response } from "super-sitemap/sveltekit";

export const GET: RequestHandler = async () => {
  const domain = env.DOMAIN || "oddinpay.com";

  const origin = `https://status.${domain}`;

  return await response({
    origin,
    excludeRoutePatterns: [/^\/unsubscribe(?:$|\/)/],
  });
};
