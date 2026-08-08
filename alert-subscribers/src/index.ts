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
  async queue(batch: MessageBatch<EmailTask>, env: Bindings): Promise<void> {
    const client = getConvex(env);
    const resend = new Resend(env.RESEND_API_KEY);
    const messages = batch.messages;

    const totalMessages = messages.length;
    let totalSuccessfullySent = 0;
    let notificationId = null;

    try {
      notificationId = await client.mutation(api.notifications.post, {
        apiKey: env.API_KEY,
        status: "pending",
        note: `Processing queue batch of ${totalMessages} emails`,
      });
    } catch (err) {
      console.error("[Convex Log Error]:", err);
    }

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
        const { data, error } = await resend.batch.send(emailPayloads);

        if (error) {
          console.error("[Queue] Resend batch top-level error:", error);
          for (const message of chunk) {
            if (message.attempts < 20) {
              const delay = calculateBackoff(message.attempts, 30);
              message.retry({ delaySeconds: delay });
            } else {
              console.error(
                `[Queue] Max retries reached for ${message.id}. Routing to DLQ.`,
              );
              message.retry();
            }
          }
          continue;
        }

        const results = (Array.isArray(data) ? data : data?.data) || [];

        for (let j = 0; j < chunk.length; j++) {
          const message = chunk[j];
          const result = results[j];

          if (result && result.error) {
            console.error(
              `[Queue] Failed to send email to ${emailPayloads[j].to}:`,
              result.error,
            );

            if (message.attempts < 20) {
              const delay = calculateBackoff(message.attempts, 30);
              message.retry({ delaySeconds: delay });
            } else {
              console.error(
                `[Queue] Max retries reached for ${message.id}. Routing to DLQ.`,
              );
              message.retry();
            }
          } else {
            message.ack();
            totalSuccessfullySent++;
          }
        }
      } catch (err) {
        const error = err as Error;
        console.error(`[Queue] Failed processing chunk: ${error.message}`);

        for (const message of chunk) {
          if (message.attempts < 20) {
            const delay = calculateBackoff(message.attempts, 30);
            message.retry({ delaySeconds: delay });
          } else {
            console.error(
              `[Queue] Max retries reached for ${message.id}. Routing to DLQ.`,
            );
            message.retry();
          }
        }
      }
    }

    console.log(
      `[Queue] Total emails sent: ${totalSuccessfullySent}/${totalMessages}`,
    );

    if (notificationId) {
      try {
        await client.mutation(api.notifications.update, {
          apiKey: env.API_KEY,
          id: notificationId,
          status: "completed",
          note: `Successfully sent ${totalSuccessfullySent}/${totalMessages} emails.`,
        });
      } catch (err) {
        console.error("[Convex Final Log Error]:", err);
      }
    }
  },

  fetch: app.fetch,
};
