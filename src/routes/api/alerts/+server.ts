import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

export async function POST({ request }: RequestEvent) {
  try {
    const body = (await request.json()) as {
      name?: string;
      state?: string;
      timestamp?: string;
      date?: string;
    };
    const { name, state, timestamp, date } = body;

    if (!name || !state) {
      return json(
        { error: "Missing required fields (name, state)" },
        { status: 400 },
      );
    }

    console.log(
      `[Alert Received] Probe: ${name} is ${state} at ${timestamp} on ${date}`,
    );

    if (state === "DOWN") {
      // Trigger your notification logic for downtime
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
