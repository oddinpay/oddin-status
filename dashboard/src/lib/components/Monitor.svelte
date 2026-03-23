<script lang="ts">
  import Button, { buttonVariants } from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
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

  const id = $props.id();
  let open = $state(false);

  const services = [
    { value: "HTTPS", label: "HTTPS" },
    { value: "HTTP", label: "HTTP" },
    { value: "TCP", label: "TCP" },
    { value: "DNS", label: "DNS" },
  ];

  let value = $state("HTTPS");
  let interval = $state();
  let url = $state();
  let host = $state();

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
    services.find((f) => f.value === value)?.label ?? services[0].label,
  );
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
              <div class="space-y-2">
                <Form.Label class="font-bold text-gray-300" for="title"
                  >Monitor Type</Form.Label
                >
                <Select.Root
                  type="single"
                  name="monitorType"
                  required
                  bind:value
                >
                  <Select.Trigger
                    class="w-full cursor-pointer border-zinc-700 text-white [&_svg:not([class*='text-'])]:text-zinc-200"
                  >
                    {triggerContent}
                  </Select.Trigger>
                  <Select.Content class="bg-zinc-800 text-white">
                    <Select.Group>
                      <Select.Label class="text-zinc-400">services</Select.Label
                      >
                      {#each services as type (type.value)}
                        <Select.Item
                          id="{id}-monitorType"
                          class="cursor-pointer  data-highlighted:bg-zinc-700 data-highlighted:text-white [&_svg:not([class*='text-'])]:text-gray-300"
                          value={type.value}
                          label={type.label}
                        >
                          {type.label}
                        </Select.Item>
                      {/each}
                    </Select.Group>
                  </Select.Content>
                </Select.Root>
              </div>

              <div class="space-y-2">
                {#if value === "DNS"}
                  <Form.Label class="font-bold text-gray-300" for="slug"
                    >Host</Form.Label
                  >
                {:else if value === "TCP"}
                  <Form.Label class="font-bold text-gray-300" for="slug"
                    >Host</Form.Label
                  >
                {:else}
                  <Form.Label class="font-bold text-gray-300" for="slug"
                    >URL</Form.Label
                  >
                {/if}

                {#if value === "HTTP" || value === "HTTPS"}
                  <Input
                    class="border-zinc-700 text-white"
                    id="{id}-url"
                    placeholder="https://oddinpay.com"
                    type="text"
                    bind:value={url}
                    required
                  />
                {:else}
                  <Input
                    class="border-zinc-700 text-white"
                    id="{id}-host"
                    placeholder="IP address or domain"
                    type="text"
                    bind:value={host}
                    required
                  />
                {/if}
              </div>

              {#if value === "TCP"}
                <div class="space-y-2">
                  <Form.Label class="font-bold text-gray-300" for="slug"
                    >Port</Form.Label
                  >
                  <Input
                    class="border-zinc-700 text-white"
                    id="{id}-description"
                    placeholder="443"
                    type="number"
                    required
                  />
                </div>
              {/if}
            </div>
            <div class="space-y-2">
              <Form.Label class="font-bold text-gray-300" for="logo"
                >Interval</Form.Label
              >
              <Input
                class=" border-zinc-700 text-white"
                id="{id}-logo"
                placeholder="10s"
                type="number"
                bind:value={interval}
                required
              />
            </div>
            <Form.Button
              class="mt-2 w-full cursor-pointer"
              type="submit"
              formaction="?/create"
              variant="outline">Save</Form.Button
            >
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
