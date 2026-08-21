import { json } from "@sveltejs/kit";
import type { RequestHandler, RequestEvent } from "./$types";
import { jwtDecrypt, base64url } from "jose";
import { drizzle } from "drizzle-orm/d1";
import { subscribers } from "$lib/schema";
import { eq } from "drizzle-orm";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

type PlatformEnv = NonNullable<RequestEvent["platform"]>["env"];

async function getEmailFromToken(
  token: string | null,
  env?: PlatformEnv,
): Promise<string | null> {
  if (!token || !env?.UNSUBSCRIBE_SECRET) return null;

  try {
    const domain = env.DOMAIN || "oddinpay.com";
    const issuer = `https://status.${domain}`;
    const audience = `${issuer}/unsubscribe`;
    const secret = base64url.decode(env.UNSUBSCRIBE_SECRET);

    const { payload } = await jwtDecrypt(token, secret, {
      issuer,
      audience,
    });

    return typeof payload.sub === "string" ? payload.sub : null;
  } catch (err) {
    console.error("Token decryption error:", err);
    return null;
  }
}

async function deleteSubscriber(
  email: string,
  platform?: RequestEvent["platform"],
) {
  if (platform?.env?.ohstatus) {
    const db = drizzle(platform.env.ohstatus);
    await db.delete(subscribers).where(eq(subscribers.email, email));
  }

  if (platform?.env?.CONVEX_CLOUD_URL) {
    const convex = new ConvexHttpClient(platform.env.CONVEX_CLOUD_URL);
    await convex.mutation(api.subscribers.deleteByEmail, {
      apiKey: platform.env.API_KEY,
      email,
    });
  }
}

async function isSubscribed(
  email: string,
  platform?: RequestEvent["platform"],
): Promise<boolean> {
  if (platform?.env?.ohstatus) {
    const db = drizzle(platform.env.ohstatus);

    const existing = await db
      .select({ email: subscribers.email })
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .get();

    return !!existing;
  }

  return false;
}

export const POST: RequestHandler = async ({ url, platform }) => {
  let token = url.searchParams.get("token");

  if (!token) {
    return json({ error: "Missing token" }, { status: 400 });
  }

  const email = await getEmailFromToken(token, platform?.env);

  if (!email) {
    return json(
      { error: "Invalid, missing, or expired unsubscribe token" },
      { status: 400 },
    );
  }

  const exists = await isSubscribed(email, platform);

  if (!exists) {
    return json({ error: "Invalid token" }, { status: 400 });
  }

  if (platform?.ctx?.waitUntil) {
    platform?.ctx.waitUntil(
      deleteSubscriber(email, platform).catch(console.error),
    );
  } else {
    await deleteSubscriber(email, platform);
  }

  return new Response(null, { status: 202 });
};
