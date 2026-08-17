import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/d1";
import { subscribers } from "$lib/schema";
import { asc, gt } from "drizzle-orm";
import { Renderer } from "@better-svelte-email/server";
import Down from "$lib/emails/down.svelte";
import Warn from "$lib/emails/warn.svelte";

import Downo from "$lib/emails/downo.svelte";
import Warno from "$lib/emails/warno.svelte";

import { EncryptJWT, base64url } from "jose";

const { render } = new Renderer();

export async function POST({ request, platform }: RequestEvent) {
  try {
    const body = (await request.json()) as {
      name?: string;
      state?: string;
    };
    const { name, state } = body;

    if (!name || !state) {
      return json(
        { error: "Missing required fields (name, state)" },
        { status: 400 },
      );
    }

    console.log(`[Alert Received] Probe: ${name} is ${state}`);

    const domain = platform?.env?.DOMAIN || "oddinpay.com";
    const unsubscribeSecret = platform?.env?.UNSUBSCRIBE_SECRET;

    if (state === "down" || state === "warn") {
      const emailQueue = platform?.env?.SEND_ALERTS_QUEUE;

      const subject =
        state === "down"
          ? `${name} is DOWN!`
          : `${name} is EXPERIENCING ISSUES!`;

      const emailTemplate =
        domain === "oddinpay.com"
          ? state === "down"
            ? Down
            : Warn
          : state === "down"
            ? Downo
            : Warno;

      const activeShards = [
        platform?.env?.ohstatus,
        // platform?.env?.DB_SHARD_2,
      ].filter(Boolean);

      if (emailQueue && activeShards.length > 0 && unsubscribeSecret) {
        const { waitUntil } = await import("cloudflare:workers");

        const backgroundTask = async () => {
          const dbBatchSize = 1000;
          const queueBatchSize = 100;

          const issuer = `https://status.${domain}`;
          const audience = `${issuer}/unsubscribe`;
          const fromHeader = `Oddinpay Status <status@${domain}>`;
          const secret = base64url.decode(unsubscribeSecret);

          for (const shardBinding of activeShards) {
            const db = drizzle(shardBinding!);
            let lastEmail: string | undefined = undefined;
            let hasMore = true;

            while (hasMore) {
              let query = db
                .select({ email: subscribers.email })
                .from(subscribers)
                .orderBy(asc(subscribers.email))
                .limit(dbBatchSize);

              if (lastEmail) {
                query = query.where(
                  gt(subscribers.email, lastEmail),
                ) as typeof query;
              }

              const results = await query.all();

              if (!results || results.length === 0) {
                break;
              }

              for (let i = 0; i < results.length; i += queueBatchSize) {
                const chunk = results.slice(i, i + queueBatchSize);

                const messages = await Promise.all(
                  chunk.map(async (row) => {
                    const token = await new EncryptJWT()
                      .setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
                      .setSubject(row.email)
                      .setIssuer(issuer)
                      .setAudience(audience)
                      .setIssuedAt()
                      .setExpirationTime("30d")
                      .encrypt(secret);

                    const unsubscribeLink = `${audience}?token=${token}`;

                    const html = await render(emailTemplate, {
                      props: { name, unsubscribeLink },
                    });

                    return {
                      body: {
                        from: fromHeader,
                        email: row.email,
                        subject: subject,
                        template: html,
                      },
                    };
                  }),
                );

                await emailQueue.sendBatch(messages);
              }

              lastEmail = results[results.length - 1].email;

              if (results.length < dbBatchSize) {
                hasMore = false;
              }
            }
          }
        };

        waitUntil(
          backgroundTask().catch((err) =>
            console.error("Error in alert queue background task:", err),
          ),
        );
      }
    }

    return json(
      { success: true, message: "Alert processed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to process alert payload:", error);
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
