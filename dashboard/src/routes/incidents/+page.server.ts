import { zod4 } from "sveltekit-superforms/adapters";
import { incidentCreate, incidentUpdate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "../monitors/$types";
import { setError, superValidate } from "sveltekit-superforms";
import { api } from "../../convex/_generated/api";
import { env } from "$env/dynamic/private";
import { typeid } from "typeid-js";
import { createConvexAuthHandlers } from "@mmailaender/convex-auth-svelte/sveltekit/server";

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, zod4(incidentCreate));
  return {
    form,
  };
};

export const actions: Actions = {
  create: async (e) => {
    const form = await superValidate(e, zod4(incidentCreate));
    if (!form.valid) return fail(400, { form });

    try {
      const { createConvexHttpClient, isAuthenticated } =
        createConvexAuthHandlers();

      if (!(await isAuthenticated(e))) {
        return setError(form, "", "Unauthorized: You must be logged in.");
      }

      const convex = await createConvexHttpClient(e);
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(form, "", "API_KEY environment variable is not set");
      }

      await convex.mutation(api.incidents.post, {
        apiKey,
        parentId: typeid("in").toString(),
        title: form.data.title,
        service: form.data.service,
        status: form.data.status,
        note: form.data.note,
      });
    } catch (error) {
      return setError(form, "", "Failed to create incident");
    }

    return { form };
  },

  update: async (e) => {
    const form = await superValidate(e, zod4(incidentUpdate));
    if (!form.valid) return fail(400, { form });

    try {
      const { createConvexHttpClient, isAuthenticated } =
        createConvexAuthHandlers();

      if (!(await isAuthenticated(e))) {
        return setError(form, "", "Unauthorized: You must be logged in.");
      }

      const convex = await createConvexHttpClient(e);
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(form, "", "API_KEY environment variable is not set");
      }

      await convex.mutation(api.incidents.update, {
        apiKey,
        parentId: form.data.parentId,
        service: form.data.service as string,
        status: form.data.status,
        note: form.data.note as string,
      });
    } catch (error) {
      return setError(form, "", "Failed to update incident");
    }

    return { form };
  },

  delete: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    const id = formData.get("_id");
    if (!id) {
      return { status: 400, body: "Missing ID" };
    }

    try {
      const { createConvexHttpClient, isAuthenticated } =
        createConvexAuthHandlers();

      if (!(await isAuthenticated(event))) {
        return setError(
          formData as any,
          "",
          "Unauthorized: You must be logged in.",
        );
      }

      const convex = await createConvexHttpClient(event);
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(
          formData as any,
          "",
          "API_KEY environment variable is not set",
        );
      }

      await convex.mutation(api.incidents.deleteById, {
        apiKey,
        id: formData.get("_id") as any,
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      return { status: 500, body: "Failed to delete" };
    }
  },

  deleteBulk: async (event) => {
    const { request } = event;
    const formData = await request.formData();
    const rawIdData = formData.get("_id");

    if (!rawIdData) {
      return { status: 400, body: "Missing IDs" };
    }

    try {
      const { createConvexHttpClient, isAuthenticated } =
        createConvexAuthHandlers();

      if (!(await isAuthenticated(event))) {
        return { status: 500, body: "Unauthorized: You must be logged in." };
      }

      const convex = await createConvexHttpClient(event);
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return { status: 500, body: "API_KEY not set" };
      }

      const ids = JSON.parse(rawIdData as string);

      await convex.mutation(api.incidents.deleteBulk, {
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
