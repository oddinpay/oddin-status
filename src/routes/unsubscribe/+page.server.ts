import type { RequestEvent } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { jwtDecrypt, base64url } from "jose";
import { drizzle } from "drizzle-orm/d1";
import { subscribers } from "$lib/schema";
import { eq } from "drizzle-orm";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

async function getEmailFromToken(
  token: string | null,
  env?: Record<string, any>,
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

    return (payload.sub as string) || null;
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

export const load: PageServerLoad = async ({ url, platform }) => {
  const token = url.searchParams.get("token");
  const email = await getEmailFromToken(token, platform?.env);

  if (!email) {
    return { success: false };
  }

  if (platform?.ctx?.waitUntil) {
    platform.ctx.waitUntil(
      deleteSubscriber(email, platform).catch(console.error),
    );
  } else {
    await deleteSubscriber(email, platform);
  }

  return { success: true };
};
