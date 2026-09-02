import { zod4 } from "sveltekit-superforms/adapters";
import { subscriberCreate } from "$lib/types/form";
import { fail, type Actions } from "@sveltejs/kit";
import { setError, superValidate } from "sveltekit-superforms";
import type { PageServerLoad } from "./[...catchall]/$types";
import { subscribers } from "$lib/schema";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { Renderer } from "@better-svelte-email/server";
import Status from "$lib/emails/status.svelte";
import Statuso from "$lib/emails/statuso.svelte";

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(event, zod4(subscriberCreate));
  return {
    form,
  };
};

const { render } = new Renderer();

export const actions: Actions = {
  create: async (e) => {
    const form = await superValidate(e, zod4(subscriberCreate));
    if (!form.valid) return fail(400, { form });

    const db = drizzle(e.platform!.env.ohstatus);
    const { email } = form.data;

    const existing = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, email))
      .get();

    if (existing) {
      return setError(form, "email", "This email is already subscribed.");
    }

    try {
      const emailQueue = e.platform?.env?.SUBSCRIBERS_QUEUE;

      if (emailQueue) {
        const { waitUntil } = await import("cloudflare:workers");

        const domain = e.platform?.env?.DOMAIN || "oddinpay.com";

        const emailTemplate = domain === "oddinpay.com" ? Status : Statuso;

        const username = email.split("@")[0];

        const html = await render(emailTemplate, { props: { username } });

        const sendEmailTask = emailQueue.send({
          from: `Oddinpay Status <hello@${domain}>`,
          email: email,
          subject: "You have successfully subscribed to ohstatus.",
          template: html,
        });

        waitUntil(sendEmailTask);
      }

      await db
        .insert(subscribers)
        .values({
          email: email,
        })
        .onConflictDoNothing();
    } catch (error) {
      return setError(
        form,
        "email",
        "Failed to subscribe. Please try again later.",
      );
    }

    return { form };
  },
};
