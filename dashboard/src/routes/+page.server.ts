import { zod4 } from "sveltekit-superforms/adapters";
import { formSchema, formUpdate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { setError, superValidate } from "sveltekit-superforms";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, zod4(formSchema));
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
    const form = await superValidate(e, zod4(formSchema));
    if (!form.valid) return fail(400, { form });

    try {
      const convex = getConvexClient();
      const apiKey = env.API_KEY;

      if (!apiKey) {
        return setError(form, "", "API_KEY environment variable is not set");
      }

      await convex.mutation(api.site.post, {
        apiKey,
        title: form.data.title ?? "",
        description: form.data.description ?? "",
        textLogo: form.data.textLogo ?? "",
        signupUrl: form.data.signup ?? "",
        signinUrl: form.data.signin ?? "",
        image: form.data.image ?? "",
        slug: form.data.slug ?? "",
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
      const convex = getConvexClient();
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
