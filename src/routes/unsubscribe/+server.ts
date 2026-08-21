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
  rawToken: string | null,
  env?: PlatformEnv,
): Promise<string | null> {
  const secretKey = env?.UNSUBSCRIBE_SECRET || process.env.UNSUBSCRIBE_SECRET;

  if (!rawToken || !secretKey) {
    console.error(
      "[Unsubscribe Error] Missing token or UNSUBSCRIBE_SECRET environment variable.",
    );
    return null;
  }

  const token = rawToken.replace(/ /g, "+");

  try {
    const domain = env?.DOMAIN || process.env.DOMAIN || "oddinpay.com";
    const issuer = `https://status.${domain}`;
    const audience = `${issuer}/unsubscribe`;
    const secret = base64url.decode(secretKey);

    const { payload } = await jwtDecrypt(token, secret, {
      issuer,
      audience,
    });

    return typeof payload.sub === "string" ? payload.sub : null;
  } catch (err) {
    console.error("[Unsubscribe JWT Decryption Failed]:", err);
    return null;
  }
}

async function deleteSubscriber(
  email: string,
  platform?: RequestEvent["platform"],
) {
  const env = platform?.env;

  if (env?.ohstatus) {
    const db = drizzle(env.ohstatus);
    await db.delete(subscribers).where(eq(subscribers.email, email));
  }

  const convexUrl = env?.CONVEX_CLOUD_URL || process.env.CONVEX_CLOUD_URL;
  const apiKey = env?.API_KEY || process.env.API_KEY;

  if (convexUrl && apiKey) {
    const convex = new ConvexHttpClient(convexUrl);
    await convex.mutation(api.subscribers.deleteByEmail, {
      apiKey,
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

  const ctx = platform?.ctx;

  if (ctx?.waitUntil) {
    ctx.waitUntil(deleteSubscriber(email, platform).catch(console.error));
  } else {
    deleteSubscriber(email, platform).catch(console.error);
  }

  return new Response(null, { status: 202 });
};
