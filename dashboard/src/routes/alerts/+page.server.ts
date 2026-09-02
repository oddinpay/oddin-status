import { type Actions } from "@sveltejs/kit";
import { setError } from "sveltekit-superforms";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { env } from "$env/dynamic/private";
import { removeSubscriber, removeSubscribersBulk } from "$lib/server/schema";

const getConvexClient = () => {
  const url = env.CONVEX_CLOUD_URL;
  if (!url) {
    throw new Error("CONVEX_CLOUD_URL environment variable is not set");
  }
  return new ConvexHttpClient(url);
};

export const actions: Actions = {
  delete: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const id = formData.get("_id");

    if (!id) {
      return { status: 400, body: "Missing ID" };
    }

    if (!email) {
      return { status: 400, body: "Missing email" };
    }

    try {
      await removeSubscriber(email);

      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(
          formData as any,
          "",
          "API_KEY environment variable is not set",
        );
      }

      await convex.mutation(api.subscribers.deleteById, {
        apiKey,
        id: formData.get("_id") as any,
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      return { status: 500, body: "Failed to delete" };
    }
  },

  deleteBulk: async ({ request }) => {
    const formData = await request.formData();
    const rawIdData = formData.get("_id");
    const rawEmailData = formData.get("email");

    if (!rawIdData) {
      return { status: 400, body: "Missing IDs" };
    }

    if (!rawEmailData) {
      return { status: 400, body: "Missing emails" };
    }

    try {
      const emails = JSON.parse(rawEmailData as string);
      await removeSubscribersBulk(emails);

      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return { status: 500, body: "API_KEY not set" };
      }

      const ids = JSON.parse(rawIdData as string);

      await convex.mutation(api.subscribers.deleteBulk, {
        apiKey,
        id: ids,
      });

      return { success: true };
    } catch (err) {
      console.error("Bulk delete failed:", err);
      return { status: 500, body: "Failed to delete" };
    }
  },
};
