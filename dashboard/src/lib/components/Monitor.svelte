<script lang="ts">
  import Button, { buttonVariants } from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import * as Select from "$lib/components/ui/select/index.js";
  import { SquareActivity } from "lucide-svelte";
  import * as Empty from "$lib/components/ui/empty/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import { page } from "$app/state";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { toast, Toaster } from "svelte-sonner";
  import { formCreate } from "$lib/types/form";
  import Loader2 from "@lucide/svelte/icons/loader-2";

  let open = $state(false);

  const services = [
    { value: "https", label: "HTTPS" },
    { value: "http", label: "HTTP" },
    { value: "tcp", label: "TCP" },
    { value: "dns", label: "DNS" },
  ];

  const form = superForm(page.data.form, {
    id: "create-monitor",
    resetForm: true,
    validators: zod4(formCreate),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        open = false;
        toast.success("Monitor created successfully!");
      } else {
        open = false;
        const serverMessage = f.errors._errors?.[0];
        const finalMessage =
          serverMessage || "Something went wrong. Please try again.";
        toast.error(finalMessage);
      }
    },
  });

  const { form: formData, submitting, enhance } = form;

  const triggerContent = $derived(
    services.find((f) => f.value === $formData.monitorType)?.label ?? "HTTPS",
  );

  if (!$formData.monitorType) {
    $formData.monitorType = "https";
  }
</script>

<Toaster closeButton position="top-center" />

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      <SquareActivity />
    </Empty.Media>
    <Empty.Title class=" text-gray-200">Let’s Get Started</Empty.Title>
    <Empty.Description class="text-gray-400">
      Get started by creating an uptime monitor, and you’ll start seeing
      real-time updates.
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Dialog.Root bind:open>
        <Dialog.Trigger
          class={cn("cursor-pointer", buttonVariants({ variant: "outline" }))}
          >Create monitor</Dialog.Trigger
        >
        <Dialog.Content class="bg-zinc-900">
          <div class="flex flex-col items-center gap-2">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <SquareActivity class="h-10 w-10 text-white" />
            </div>

            <Dialog.Header>
              <Dialog.Title class=" text-gray-300 sm:text-center"
                >Create Monitor</Dialog.Title
              >
              <Dialog.Description class="text-gray-400 sm:text-center">
                Set up and publish your uptime monitor.
              </Dialog.Description>
            </Dialog.Header>
          </div>

          <form method="POST" class="space-y-5" use:enhance>
            <div class="space-y-4">
              <div class="space-y-2">
                <Form.Field {form} name="name">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300" for="logo"
                        >Name</Form.Label
                      >
                      <Input
                        class=" border-zinc-700 text-white"
                        placeholder="oddinpay"
                        type="text"
                        {...props}
                        bind:value={$formData.name}
                        required
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <Form.Field {form} name="protocol">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label class="font-bold text-gray-300"
                      >Monitor Type</Form.Label
                    >
                    <Select.Root
                      type="single"
                      bind:value={$formData.monitorType}
                      name={props.name}
                    >
                      <Select.Trigger
                        class="w-full cursor-pointer border-zinc-700 text-white"
                      >
                        {triggerContent}
                      </Select.Trigger>

                      <Select.Content
                        class="bg-zinc-800 border-zinc-700 text-white"
                      >
                        {#each services as type}
                          <Select.Item
                            class="cursor-pointer"
                            value={type.value}
                            label={type.label}
                          >
                            {type.label}
                          </Select.Item>
                        {/each}
                      </Select.Content>
                    </Select.Root>
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <Form.Field {form} name="host">
                <Form.Control>
                  {#snippet children({ props })}
                    <Form.Label class="font-bold text-gray-300">
                      {$formData.monitorType === "dns" ||
                      $formData.monitorType === "tcp"
                        ? "IP & Port"
                        : "Domain"}
                    </Form.Label>
                    <Input
                      {...props}
                      class="border-zinc-700 text-white"
                      placeholder={$formData.monitorType === "tcp"
                        ? "127.0.0.1:8080"
                        : "www.oddinpay.com"}
                      bind:value={$formData.url}
                    />
                  {/snippet}
                </Form.Control>
                <Form.FieldErrors />
              </Form.Field>

              <div class="space-y-4">
                <Form.Field {form} name="interval">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300" for="interval"
                        >Interval</Form.Label
                      >
                      <Input
                        class=" border-zinc-700 text-white"
                        placeholder="10s"
                        type="number"
                        {...props}
                        bind:value={$formData.interval}
                        required
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>
              <Form.Button
                formaction="?/create"
                class="mt-2 w-full cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
                type="submit"
                variant="outline"
                disabled={$submitting}
                >{#if $submitting}
                  <Loader2 class="size-4 animate-spin" />
                {:else}
                  Save
                {/if}
              </Form.Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  </Empty.Content>
  <Button variant="link" class="text-gray-400" size="sm">
    <a href="#/">
      Learn More <ArrowUpRightIcon class="inline" />
    </a>
  </Button>
</Empty.Root>
