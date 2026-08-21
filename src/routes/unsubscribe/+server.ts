import { json } from "@sveltejs/kit";
import type { RequestHandler, RequestEvent } from "./$types";
import { jwtDecrypt, base64url } from "jose";
import { drizzle } from "drizzle-orm/d1";
import { subscribers } from "$lib/schema";
import { eq } from "drizzle-orm";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

type PlatformEnv = NonNullable<RequestEvent["platform"]>["env"];

interface UnsubscribeRequestBody {
  token?: string;
}

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

export const POST: RequestHandler = async ({ url, request, platform }) => {
  let token = url.searchParams.get("token");

  if (!token) {
    const contentType = request.headers.get("content-type") || "";

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData().catch(() => null);
      const tokenEntry = formData?.get("token");
      token = typeof tokenEntry === "string" ? tokenEntry : null;
    } else if (contentType.includes("application/json")) {
      const body = (await request
        .json()
        .catch(() => ({}))) as UnsubscribeRequestBody;
      token = body.token || null;
    }
  }

  const email = await getEmailFromToken(token, platform?.env);

  if (!email) {
    return json(
      { error: "Invalid, missing, or expired unsubscribe token" },
      { status: 400 },
    );
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
