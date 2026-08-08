import { Hono } from "hono";
import { Resend } from "resend";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

type Bindings = {
  RESEND_API_KEY: string;
  API_KEY: string;
  PUBLIC_SYNC_CONVEX_URL: string;
};

export interface EmailTask {
  from: string;
  email: string;
  subject: string;
  template: string;
}

function calculateBackoff(attempts: number, baseDelay: number): number {
  const delay = Math.pow(2, attempts - 1) * baseDelay;
  const maxDelay = 43200; // 12 hours
  return Math.min(delay, maxDelay);
}

const app = new Hono<{ Bindings: Bindings }>();

let convex: ConvexHttpClient;

const getConvex = (env: Bindings) => {
  if (!convex) {
    convex = new ConvexHttpClient(env.PUBLIC_SYNC_CONVEX_URL);
  }
  return convex;
};

export default {
  async queue(
    batch: MessageBatch<EmailTask>,
    env: Bindings,
    ctx: ExecutionContext,
  ): Promise<void> {
    const client = getConvex(env);
    const resend = new Resend(env.RESEND_API_KEY);
    const messages = batch.messages;

    const totalMessages = messages.length;
    let totalSuccessfullySent = 0;

    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const chunkNumber = Math.floor(i / 100) + 1;
      const totalChunks = Math.ceil(messages.length / 100);

      const emailPayloads = chunk.map((m) => ({
        from: m.body.from,
        to: [m.body.email],
        subject: m.body.subject,
        html: m.body.template,
      }));

      console.log(
        `[Queue] Processing chunk ${chunkNumber}/${totalChunks} (${chunk.length} emails)`,
      );

      try {
        await client.mutation(api.notifications.post, {
          apiKey: env.API_KEY,
          status: "pending",
          note: `Processing ${chunkNumber}/${totalChunks} (${chunk.length} emails)`,
        });
      } catch (err) {
        console.error("[Convex Log Error]:", err);
      }

      try {
        const { error } = await resend.batch.send(emailPayloads);

        if (error) {
          console.error("[Queue] Resend batch error:", error);
          for (const message of chunk) {
            const delay = calculateBackoff(message.attempts, 30);
            message.retry({ delaySeconds: delay });
          }
          continue;
        }

        totalSuccessfullySent += chunk.length;

        for (const message of chunk) {
          message.ack();
        }
      } catch (err) {
        const error = err as Error;
        console.error(`[Queue] Failed processing chunk: ${error.message}`);

        for (const message of chunk) {
          if (message.attempts < 20) {
            const delay = calculateBackoff(message.attempts, 30);
            message.retry({ delaySeconds: delay });
          } else {
            console.error(`[Queue] Max retries reached for ${message.id}.`);
            message.ack();
          }
        }
      }
    }

    console.log(
      `[Queue] Total emails sent: ${totalSuccessfullySent}/${totalMessages}`,
    );

    try {
      await client.mutation(api.notifications.update, {
        apiKey: env.API_KEY,
        status: "completed",
        note: `Successfully sent ${totalSuccessfullySent}/${totalMessages} emails.`,
      });
    } catch (err) {
      console.error("[Convex Final Log Error]:", err);
    }
  },

  fetch: app.fetch,
};
