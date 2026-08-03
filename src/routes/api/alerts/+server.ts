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

    if (state == "down" || state === "warn") {
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

      const html = await render(emailTemplate, {
        props: { name },
      });

      const activeShards = [
        platform?.env?.ohstatus,
        // platform?.env?.DB_SHARD_2,
      ].filter(Boolean);

      if (emailQueue && activeShards.length > 0) {
        const { waitUntil } = await import("cloudflare:workers");

        const backgroundTask = async () => {
          const batchSize = 1000;

          for (const shardBinding of activeShards) {
            const db = drizzle(shardBinding!);
            let lastEmail: string | undefined = undefined;
            let hasMore = true;

            while (hasMore) {
              let query = db
                .select({ email: subscribers.email })
                .from(subscribers)
                .orderBy(asc(subscribers.email))
                .limit(batchSize);

              if (lastEmail) {
                query = query.where(
                  gt(subscribers.email, lastEmail),
                ) as typeof query;
              }

              const results = await query.all();

              if (!results || results.length === 0) {
                break;
              }

              const messages = results.map((row) => ({
                body: {
                  from: `Oddinpay Status <status@${domain}>`,
                  email: row.email,
                  subject: subject,
                  template: html,
                },
              }));

              for (let i = 0; i < messages.length; i += 100) {
                await emailQueue.sendBatch(messages.slice(i, i + 100));
              }

              lastEmail = results[results.length - 1].email;

              if (results.length < batchSize) {
                hasMore = false;
              }
            }
          }
        };

        waitUntil(backgroundTask());
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
