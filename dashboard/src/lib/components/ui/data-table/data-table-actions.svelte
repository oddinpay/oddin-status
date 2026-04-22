<script lang="ts">
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import { monitorUpdate } from "$lib/types/form";
  import { page } from "$app/state";
  import {
    ConfirmDeleteDialog,
    confirmDelete,
  } from "$lib/components/ui/confirm-delete-dialog";

  import * as Select from "$lib/components/ui/select/index.js";
  import * as Form from "$lib/components/ui/form/index.js";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { SquareActivity } from "lucide-svelte";

  let { id, name }: { id: string; name: string } = $props();

  let open = $state(false);

  const services = [
    { value: "https", label: "HTTPS" },
    { value: "http", label: "HTTP" },
    { value: "tcp", label: "TCP" },
    { value: "dns", label: "DNS" },
  ];

  const form = superForm(page.data.form, {
    id: "update-monitor",
    resetForm: true,
    validators: zod4(monitorUpdate),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        open = false;
        toast.success("Monitor updated successfully!");
      } else {
        open = false;
        toast.error("Something went wrong. Please try again.");
      }
    },
  });

  const { form: formData, submitting, enhance } = form;

  const triggerContent = $derived(
    services.find((f) => f.value === $formData.monitorType)?.label ?? "HTTPS",
  );

  $effect(() => {
    if (!$formData.monitorType) {
      $formData.monitorType = "https";
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="bg-zinc-900 ">
    <div class="flex flex-col items-center gap-2">
      <div
        class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border"
        aria-hidden="true"
      >
        <SquareActivity class="h-10 w-10 text-white" />
      </div>

      <Dialog.Header>
        <Dialog.Title class=" text-gray-300 sm:text-center"
          >Update Monitor</Dialog.Title
        >
        <Dialog.Description class="text-gray-400 sm:text-center">
          Update your monitor settings.
        </Dialog.Description>
      </Dialog.Header>
    </div>

    <form method="POST" class="space-y-5" use:enhance>
      <div class="space-y-4">
        <div class="space-y-2">
          <Form.Field {form} name="_id">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label class="font-bold text-gray-300">ID</Form.Label>
                <Input
                  class="border-zinc-700  disabled:pointer-events-none disabled:cursor-all-scroll bg-transparent text-white"
                  placeholder="60f5a3c2e1b2c3d4e5f67890"
                  type="text"
                  readonly
                  {...props}
                  bind:value={id}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>
        <div class="space-y-2">
          <Form.Field {form} name="name">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label class="font-bold text-gray-300" for="logo"
                  >Name</Form.Label
                >
                <Input
                  class=" border-zinc-700 bg-transparent text-white"
                  placeholder={name}
                  type="text"
                  {...props}
                  bind:value={$formData.name}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>

        <Form.Field {form} name="protocol">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="font-bold text-gray-300">Protocol</Form.Label>
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

                <Select.Content class="bg-zinc-800 border-zinc-700 text-white">
                  {#each services as type}
                    <Select.Item
                      class="cursor-pointer data-highlighted:bg-zinc-700 data-highlighted:text-white [&_svg:not([class*='text-'])]:text-gray-500"
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
                  ? "Host"
                  : "Domain"}
              </Form.Label>
              <Input
                {...props}
                class="border-zinc-700 bg-transparent text-white"
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
                  class=" border-zinc-700 bg-transparent text-white"
                  placeholder="10s"
                  type="number"
                  {...props}
                  bind:value={$formData.interval}
                />
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>
        <Form.Button
          formaction="?/update"
          class="mt-2 w-full cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
          type="submit"
          variant="outline"
          disabled={$submitting}
          >{#if $submitting}
            <Loader2 class="size-4 animate-spin" />
          {:else}
            Update
          {/if}
        </Form.Button>
      </div>
    </form></Dialog.Content
  >
</Dialog.Root>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: "outline", size: "icon-sm" }) +
      " cursor-pointer text-white hover:text-gray-300 bg-zinc-800 border-zinc-600 hover:bg-zinc-900"}
  >
    <MoreHorizontal />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-40 " align="end">
    <DropdownMenu.Group>
      <DropdownMenu.Label>Actions</DropdownMenu.Label>
      <DropdownMenu.Item
        class="cursor-pointer text-black data-highlighted:bg-zinc-200 data-highlighted:text-black"
        onSelect={() => (open = true)}
      >
        Edit
      </DropdownMenu.Item>

      <DropdownMenu.Item
        class="cursor-pointer text-red-600 data-highlighted:bg-red-100 data-highlighted:text-red-600"
        onSelect={() => {
          confirmDelete({
            title: "Delete monitor",
            description:
              "Are you sure you want to delete this monitor? This action cannot be undone.",
            input: {
              confirmationText: "yes",
            },
            onConfirm: async () => {
              const formData = new FormData();

              formData.append("_id", id);

              formData.append("confirmation", "yes");

              const response = await fetch("?/delete", {
                method: "POST",
                body: formData,
              });

              if (response.ok) {
                toast.success(`${name} deleted successfully!`);
              } else {
                toast.error("Failed to delete.");
              }
            },
          });
        }}
      >
        Delete
      </DropdownMenu.Item>
    </DropdownMenu.Group>
  </DropdownMenu.Content>
</DropdownMenu.Root>

<ConfirmDeleteDialog />
