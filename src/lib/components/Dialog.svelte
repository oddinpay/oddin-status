<script lang="ts">
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Bell } from "lucide-svelte";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import * as Form from "$lib/components/ui/form/index.js";
  import { superForm } from "sveltekit-superforms";
  import { page } from "$app/state";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { subscriberCreate } from "$lib/types/form";
  import { createWebHaptics } from "web-haptics/svelte";
  import { onDestroy } from "svelte";
  import { fade } from "svelte/transition";

  const { trigger, destroy } = createWebHaptics();
  onDestroy(destroy);

  let showCompletionDialog = $state(false);
  let sucess = $state(false);

  $effect(() => {
    if (!showCompletionDialog) {
      sucess = false;
    }
  });

  const form = superForm(page.data.form, {
    id: "create-subscriber",
    resetForm: true,
    validators: zod4(subscriberCreate),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        sucess = true;
      } else {
        sucess = false;
      }
      showCompletionDialog = true;
    },
  });

  const { form: formData, submitting, enhance } = form;
</script>

<Dialog.Root bind:open={showCompletionDialog}>
  <Dialog.Trigger
    type="button"
    class="{buttonVariants({ variant: 'outline' })} cursor-pointer"
  >
    <Bell />
  </Dialog.Trigger>

  <Dialog.Content
    class="sm:max-w-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-75 data-[state=open]:duration-300 data-[state=open]:ease-[cubic-bezier(0.05,0.7,0.1,1.0)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-75 data-[state=closed]:duration-150 data-[state=closed]:ease-[cubic-bezier(0.3,0,0.8,0.15)]"
  >
    {#if sucess}
      <div in:fade={{ duration: 200 }}>
        <Dialog.Header>
          <Dialog.Title>Subscribed!</Dialog.Title>
          <Dialog.Description class="mt-2 text-gray-500">
            You will receive email notifications whenever creates, updates, or
            resolves an incident.
          </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-3 mt-4">
          <svg
            class="checkmark2 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              class="checkmark__circle2 animate-circle2"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              class="checkmark__check2 animate-check2"
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>

          <Dialog.Footer class="mt-2">
            <Form.Button
              class="w-full flex items-center justify-center bg-black text-white transition-[background-color,transform,opacity] duration-200 ease-out hover:bg-zinc-700 hover:text-white active:scale-[0.98] cursor-pointer"
              variant="outline"
              onclick={() => (showCompletionDialog = false)}
            >
              Close
            </Form.Button>
          </Dialog.Footer>
        </div>
      </div>
    {:else}
      <div in:fade={{ duration: 200 }}>
        <Dialog.Header>
          <Dialog.Title>Subscribe to alerts</Dialog.Title>
          <Dialog.Description class="mt-2 text-gray-500">
            Get email notifications whenever creates, updates, or resolves an
            incident.
          </Dialog.Description>
        </Dialog.Header>

        <form method="POST" use:enhance class="mt-4">
          <div class="grid gap-3">
            <div class="grid gap-2 mt-0.5">
              <Form.Field {form} name="email">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label for="email">Email</Form.Label>
                    <Input
                      placeholder="satoshi@example.com"
                      type="email"
                      autocomplete="email"
                      {...props}
                      bind:value={$formData.email}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>
            </div>

            <Dialog.Footer class="mt-2">
              <Form.Button
                formaction="?/create"
                class="w-full flex items-center justify-center bg-black text-white transition-[background-color,transform,opacity] duration-200 ease-out hover:bg-zinc-700 hover:text-white active:scale-[0.98] disabled:pointer-events-auto disabled:cursor-not-allowed cursor-pointer"
                type="submit"
                variant="outline"
                onclick={() => trigger([{ duration: 9 }], { intensity: 0.8 })}
                disabled={$submitting}
              >
                {#if $submitting}
                  <Loader2 class="size-4 animate-spin" />
                {:else}
                  Subscribe
                {/if}
              </Form.Button>
            </Dialog.Footer>
          </div>
        </form>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>

<style>
  .checkmark2 {
    border-radius: 50%;
    display: block;
    stroke-width: 3;
    stroke: #21ba45;
    stroke-miterlimit: 10;
    width: 70px;
    height: 70px;
  }

  .checkmark__circle2 {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 3;
    stroke-miterlimit: 10;
    stroke: #21ba45;
    fill: none;
    will-change: transform;
  }

  .checkmark__check2 {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    will-change: transform;
  }

  .animate-circle2 {
    animation: stroke-circle 1s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .animate-check2 {
    animation:
      stroke-check 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards,
      pulse-check 1.5s cubic-bezier(0.65, 0, 0.45, 1) 1.8s infinite;
  }

  @keyframes stroke-circle {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes stroke-check {
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes pulse-check {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
</style>
