import { zod4 } from "sveltekit-superforms/adapters";
import { formSchema } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { superValidate, message } from "sveltekit-superforms";

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
    return { form };
  },

  update: async (e) => {
    console.log("update action called");
    const form = await superValidate(e, zod4(formSchema));
    if (!form.valid) return fail(400, { form });
    return { form };
  },
};
