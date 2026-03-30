<script lang="ts">
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import { monitorUpdate } from "$lib/types/form";
  import * as Empty from "$lib/components/ui/empty/index.js";
  import { Button } from "$lib/components/ui/button.svelte";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import { page } from "$app/state";
  import {
    ConfirmDeleteDialog,
    confirmDelete,
  } from "$lib/components/ui/confirm-delete-dialog";

  import * as Form from "$lib/components/ui/form/index.js";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { SquareActivity } from "lucide-svelte";

  let { id }: { id: string } = $props();

  let open = $state(false);

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
</script>

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
        <Dialog.Content class="bg-zinc-900">
          <form method="POST" class="space-y-5" use:enhance>
            <div class="space-y-4">
              <div class="space-y-2">
                <Form.Field {form} name="_id">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300">ID</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="60f5a3c2e1b2c3d4e5f67890"
                        type="text"
                        {...props}
                        bind:value={id}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="title">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Title</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="Status • Oddin Pay"
                        type="text"
                        {...props}
                        bind:value={$formData.title}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="description">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Description</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="OddinPay system performance."
                        type="text"
                        {...props}
                        bind:value={$formData.description}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="slug">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Slug</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="https://oddinpay.com"
                        type="text"
                        {...props}
                        bind:value={$formData.slug}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="textLogo">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Text Logo</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="Oddin Status"
                        type="text"
                        {...props}
                        bind:value={$formData.textLogo}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="signup">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Signup URL</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="https://odinpay.com/signup"
                        type="text"
                        {...props}
                        bind:value={$formData.signup}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="signin">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Signin URL</Form.Label
                      >
                      <Input
                        class="border-zinc-700 bg-transparent text-white"
                        placeholder="https://odinpay.com/signin"
                        type="text"
                        {...props}
                        bind:value={$formData.signin}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>
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
                toast.success("Deleted successfully.");
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
