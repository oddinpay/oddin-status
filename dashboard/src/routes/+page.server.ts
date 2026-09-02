import { zod4 } from "sveltekit-superforms/adapters";
import { formSchema, formUpdate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { setError, superValidate } from "sveltekit-superforms";
import { api } from "../convex/_generated/api";
import { env } from "$env/dynamic/private";
import { createConvexAuthHandlers } from "@mmailaender/convex-auth-svelte/sveltekit/server";

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, zod4(formSchema));
  return {
    form,
  };
};

export const actions: Actions = {
  create: async (e) => {
    const form = await superValidate(e, zod4(formSchema));
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

      await convex.mutation(api.site.post, {
        apiKey,
        title: form.data.title,
        description: form.data.description,
        textLogo: form.data.textLogo as string,
        signupUrl: form.data.signup as string,
        signinUrl: form.data.signin as string,
        image: form.data.image as string,
        slug: form.data.slug as string,
      });
    } catch (error) {
      return setError(form, "", "A site already exists");
    }

    return { form };
  },

  update: async (e) => {
    const form = await superValidate(e, zod4(formUpdate));
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

      await convex.mutation(api.site.patch, {
        apiKey,
        id: form.data._id as any,
        title: form.data.title,
        description: form.data.description,
        textLogo: form.data.textLogo,
        signupUrl: form.data.signup,
        signinUrl: form.data.signin,
        image: form.data.image,
        slug: form.data.slug,
      });
    } catch (error) {
      return setError(form, "", "Failed to update");
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

      await convex.mutation(api.site.deleteById, {
        apiKey,
        id: formData.get("_id") as any,
      });

      return { success: true };
    } catch (err) {
      console.error(err);
      return { status: 500, body: "Failed to delete" };
    }
  },
};
