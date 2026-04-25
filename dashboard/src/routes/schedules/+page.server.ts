import { zod4 } from "sveltekit-superforms/adapters";
import { scheduleCreate, scheduleUpdate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { setError, superValidate } from "sveltekit-superforms";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { env } from "$env/dynamic/private";
import { typeid } from 'typeid-js';


export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, zod4(scheduleCreate));
  return {
    form,
  };
};

const getConvexClient = () => {
  const url = env.CONVEX_URL;
  if (!url) {
    throw new Error("CONVEX_URL environment variable is not set");
  }
  return new ConvexHttpClient(url);
};

export const actions: Actions = {
  create: async (e) => {
    const form = await superValidate(e, zod4(scheduleCreate));
    if (!form.valid) return fail(400, { form });

    try {
      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(form, "", "API_KEY environment variable is not set");
      }

      await convex.mutation(api.schedules.post, {
        apiKey,
        parentId: typeid("sc").toString(),
        title: form.data.title,
        service: form.data.service,
        status: form.data.status,
        note: form.data.note,
      });
    } catch (error) {
      return setError(form, "", "Failed to create schedule");
    }

    return { form };
  },

  update: async (e) => {
    const form = await superValidate(e, zod4(scheduleUpdate));
    if (!form.valid) return fail(400, { form });

    try {
      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(form, "", "API_KEY environment variable is not set");
      }

      await convex.mutation(api.schedules.update, {
        apiKey,
        parentId: form.data.parentId,
        service: form.data.service as string,
        status: form.data.status,
        note: form.data.note as string,
      });
    } catch (error) {
      return setError(form, "", "Failed to update");
    }

    return { form };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const id = formData.get("_id");
    if (!id) {
      return { status: 400, body: "Missing ID" };
    }

    try {
      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(
          formData as any,
          "",
          "API_KEY environment variable is not set",
        );
      }

      await convex.mutation(api.schedules.deleteById, {
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

    if (!rawIdData) {
      return { status: 400, body: "Missing IDs" };
    }

    try {
      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return { status: 500, body: "API_KEY not set" };
      }

      const ids = JSON.parse(rawIdData as string);

      await convex.mutation(api.schedules.deleteBulk, {
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
