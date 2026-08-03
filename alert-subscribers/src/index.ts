import { Hono } from "hono";
import { Resend } from "resend";

type Bindings = {
  RESEND_API_KEY: string;
  DOMAIN: string;
};

export interface EmailTask {
  from: string;
  email: string;
  subject: string;
  template: string;
}

function calculateBackoff(attempts: number, baseDelay: number): number {
  const delay = Math.pow(2, attempts - 1) * baseDelay;
  const maxDelay = 43200;
  return Math.min(delay, maxDelay);
}

const app = new Hono<{ Bindings: Bindings }>();

export default {
  async queue(batch: MessageBatch<EmailTask>, env: Bindings): Promise<void> {
    const resend = new Resend(env.RESEND_API_KEY);
    const messages = batch.messages;

    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);

      const emailPayloads = chunk.map((m: { body: EmailTask }) => ({
        from: m.body.from,
        to: [m.body.email],
        subject: m.body.subject,
        html: m.body.template,
      }));

      try {
        const { error } = await resend.batch.send(emailPayloads);

        if (error) {
          console.error("Resend batch error:", error);
          for (const message of chunk) {
            const delay = calculateBackoff(message.attempts, 30);
            console.log(
              `[Queue] Retrying ${message.id} in ${delay} seconds...`,
            );

            message.retry({ delaySeconds: delay });
          }
          continue;
        }

        console.log(
          `[Queue] Email sent successfully to ${chunk
            .map((m) => m.body.email)
            .join(", ")}`,
        );

        for (const message of chunk) {
          console.log(
            `[Queue] Successfully processed: ${message.id} to ${message.body.email}`,
          );

          message.ack();
        }
      } catch (err) {
        const error = err as Error;

        console.error(
          `[Queue] Failed processing chunk [${chunk.map((m) => m.id).join(", ")}]: ${error.message}`,
        );

        for (const message of chunk) {
          if (message.attempts < 20) {
            const delay = calculateBackoff(message.attempts, 30);
            console.log(
              `[Queue] Retrying ${message.id} in ${delay} seconds...`,
            );

            message.retry({ delaySeconds: delay });
            throw error;
          } else {
            console.error(
              `[Queue] Max retries reached for ${message.id}. Moving to DLQ or dropping.`,
            );
          }
        }
      }
    }
  },

  fetch: app.fetch,
};
