// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Queue } from "@cloudflare/workers-types";

declare global {
  namespace App {
    interface Platform {
      env: {
        ohstatus: D1Database;
        SUBSCRIBERS_QUEUE: Queue;
        SEND_ALERTS_QUEUE: Queue;
        UNSUBSCRIBE_SECRET: string;
        CONVEX_CLOUD_URL: string;
        DOMAIN: string;
        API_KEY: string;
        X_API_KEY: string;
      };

      ctx?: ExecutionContext;
    }
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
