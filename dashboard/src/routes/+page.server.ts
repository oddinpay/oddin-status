import { zod4 } from "sveltekit-superforms/adapters";
import { formSchema, formUpdate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
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

    const convex = getConvexClient();
    const apiKey = env.API_KEY;

    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set");
    }

    await convex.mutation(api.site.post, {
      apiKey,
      title: form.data.title ?? "",
      description: form.data.description ?? "",
      textLogo: form.data.textLogo ?? "",
      signupUrl: form.data.signup ?? "",
      signinUrl: form.data.signin ?? "",
    });

    return { form };
  },

  update: async (e) => {
    const form = await superValidate(e, zod4(formUpdate));
    if (!form.valid) return fail(400, { form });

    const convex = getConvexClient();
    await convex.mutation(api.site.patch, {
      id: form.data.id as any,
      title: form.data.title,
      image: form.data.image,
      description: form.data.description,
      textLogo: form.data.textLogo,
      signupUrl: form.data.signup,
      signinUrl: form.data.signin,
    });

    return { form };
  },
};
