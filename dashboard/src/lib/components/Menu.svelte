<script lang="ts">
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Field from "$lib/components/ui/field/index.js";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import * as Form from "$lib/components/ui/form/index.js";
  import { formUpdate } from "$lib/types/form";
  import { cn } from "$lib/utils";
  import { page } from "$app/state";
  import * as Empty from "$lib/components/ui/empty/index.js";
  import IconFileOrientation from "@tabler/icons-svelte/icons/file-orientation";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import { useImageUpload } from "$lib/hooks/use-image-upload.svelte";
  import ImagePlus from "@lucide/svelte/icons/image-plus";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import {
    ConfirmDeleteDialog,
    confirmDelete,
  } from "$lib/components/ui/confirm-delete-dialog";
  import { sleep } from "$lib/sleep";

  import { useQuery } from "convex-svelte";
  import { api } from "../../convex/_generated/api";

  const statusQuery = useQuery(api.status.get);
  const query = useQuery(api.site.get);

  let open = $state(false);
  let showShareDialog = $state(false);

  const profileImageHandler = useImageUpload({
    initialImage: "",
  });

  let profileImageBase64: string | null = null;
  const form = superForm(page.data.form, {
    id: "update-status-page",
    resetForm: true,
    validators: zod4(formUpdate),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        open = false;
        toast.success("Status page updated successfully!");
      } else {
        open = false;
        toast.error("Something went wrong. Please try again.");
      }
    },
  });

  const { form: formData, submitting, enhance } = form;
  $effect(() => {
    if (profileImageHandler.files?.length) {
      const file = profileImageHandler.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          $formData.image = result.split(",")[1];
          profileImageBase64 = result.split(",")[1];
          console.log("Base64 Image String:", profileImageBase64);
        }
      };
      reader.readAsDataURL(file);
    } else {
      profileImageBase64 = null;
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="bg-zinc-900">
    <div class="flex flex-col items-center gap-2">
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
      >
        {@render Avatar()}
      </div>

      <Dialog.Header>
        <Dialog.Title class="mt-10 text-gray-300 sm:text-center"
          >Favicon</Dialog.Title
        >
        <Dialog.Description class="text-gray-400 sm:text-center">
          Update your status page.
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
                {#each query.data as site}
                  <Input
                    class="border-zinc-700 bg-transparent text-white"
                    placeholder="60f5a3c2e1b2c3d4e5f67890"
                    type="text"
                    {...props}
                    bind:value={site._id}
                  />
                {/each}
              {/snippet}
            </Form.Control>
            <Form.FieldErrors />
          </Form.Field>
        </div>

        <div class="space-y-2">
          <Form.Field {form} name="title">
            <Form.Control>
              {#snippet children({ props })}
                <Form.Label class="font-bold text-gray-300">Title</Form.Label>
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
                <Form.Label class="font-bold text-gray-300">Slug</Form.Label>
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
        class="mt-2 w-full cursor-pointer "
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

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: "outline", size: "icon-sm" }) +
      " cursor-pointer text-white hover:text-gray-300 bg-zinc-800 border-zinc-600 hover:bg-zinc-900"}
  >
    <MoreHorizontal />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-40 " align="end">
    <DropdownMenu.Group>
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
            title: "Delete Status Page",
            description:
              "Are you sure you want to delete this item? This action cannot be undone.",
            input: {
              confirmationText: "please",
            },
            onConfirm: async () => {
              const formData = new FormData();

              if (query.data && query.data.length > 0) {
                formData.append("_id", query.data[0]._id);
              }

              formData.append("confirmation", "please");

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

{#snippet Avatar()}
  <label class="mt-10 cursor-pointer px-6" aria-label="Upload profile picture">
    <div
      class="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-4 border-zinc-600 bg-zinc-700 shadow-xs shadow-black/10"
    >
      {#if profileImageHandler.previewUrl}
        <img
          src={profileImageHandler.previewUrl}
          class="size-full object-cover"
          width={80}
          height={80}
          alt="Profile avatar"
        />
      {/if}
      <button
        type="button"
        class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-zinc-800 text-white transition-[color,box-shadow,background-color,backdrop-filter] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 {profileImageHandler.previewUrl
          ? 'hidden hover:flex'
          : 'flex'} hover:bg-black/50"
        onclick={profileImageHandler.handleThumbnailClick}
        aria-label="Change profile picture"
      >
        <ImagePlus size={16} aria-hidden="true" />
      </button>
      <input
        type="file"
        bind:this={profileImageHandler.fileInput}
        bind:files={profileImageHandler.files}
        class="hidden"
        accept="image/*"
        aria-label="Upload profile picture"
      />
    </div>
  </label>
{/snippet}
