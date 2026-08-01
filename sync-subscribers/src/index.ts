import { Hono } from "hono";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Resend } from "resend";

type Bindings = {
  PUBLIC_SYNC_CONVEX_URL: string;
  API_KEY: string;
  RESEND_API_KEY: string;
};

export interface EmailTask {
  email: string;
  from: string;
  subject: string;
  template: string;
}

function calculateBackoff(attempts: number, baseDelay: number): number {
  const delay = Math.pow(2, attempts - 1) * baseDelay;
  const maxDelay = 43200;
  return Math.min(delay, maxDelay);
}

let convex: ConvexHttpClient;

const app = new Hono<{ Bindings: Bindings }>();

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

    for (const message of batch.messages) {
      try {
        const { email, from, subject, template } = message.body;

        console.log(`[Queue] Processing: ${message.id} to ${email}`);

        await client.mutation(api.subscribers.addSubscriber, {
          apiKey: env.API_KEY,
          email,
          status: "subscribed",
        });

        console.log(
          `[Queue] Successfully processed: ${message.id} to ${email}`,
        );

        const { error } = await resend.emails.send({
          from: from,
          to: email,
          subject: subject,
          html: template,
        });

        if (error) {
          throw new Error(`Resend API Error: ${error.message}`);
        }

        console.log(`[Queue] Email sent successfully to ${email}`);
        message.ack();
      } catch (err) {
        const error = err as Error;

        console.error(`[Queue] Failed message ${message.id}: ${error.message}`);

        const { email } = message.body;

        const existingSubscriber = await client.query(
          api.subscribers.getSubscriberByEmail,
          {
            apiKey: env.API_KEY,
            email: email,
          },
        );

        if (existingSubscriber) {
          console.log(
            `[Queue] Subscriber ${email} already exists. Skipping addition to Convex.`,
          );
          message.ack();
        }

        if (message.attempts < 20) {
          const delay = calculateBackoff(message.attempts, 30);
          console.log(`[Queue] Retrying ${message.id} in ${delay} seconds...`);

          message.retry({ delaySeconds: delay });
          throw error;
        } else {
          console.error(
            `[Queue] Max retries reached for ${message.id}. Moving to DLQ or dropping.`,
          );
        }
      }
    }
  },

  fetch: app.fetch,
};
