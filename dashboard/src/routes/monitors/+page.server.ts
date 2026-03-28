import { zod4 } from "sveltekit-superforms/adapters";
import { formCreate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { setError, superValidate } from "sveltekit-superforms";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, zod4(formCreate));
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
    const form = await superValidate(e, zod4(formCreate));
    if (!form.valid) return fail(400, { form });

    try {
      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(form, "", "API_KEY environment variable is not set");
      }

      await convex.mutation(api.status.post, {
        apiKey,
        host: form.data.host ?? "",
        interval: form.data.interval ?? 0,
        name: form.data.name ?? "",
        protocol: form.data.protocol ?? "",
      });
    } catch (error) {
      return setError(form, "", "A site already exists");
    }

    return { form };
  },

  // update: async (e) => {
  //   const form = await superValidate(e, zod4(formCreate));
  //   if (!form.valid) return fail(400, { form });

  //   const convex = getConvexClient();
  //   await convex.mutation(api.status.patch, {
  //     id: form.data._id as any,
  //     host: form.data.host,
  //     interval: form.data.interval,
  //     name: form.data.name,
  //     protocol: form.data.protocol,
  //   });

  //   return { form };
  // },

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

      await convex.mutation(api.status.deleteById, {
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

      await convex.mutation(api.status.deleteBulk, {
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
