<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { Toaster, toast } from "svelte-sonner";
  import * as Form from "$lib/components/ui/form/index.js";
  import { formSchema } from "$lib/types/form";
  import Button, { buttonVariants } from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import { page } from "$app/state";
  import * as Empty from "$lib/components/ui/empty/index.js";
  import IconFileOrientation from "@tabler/icons-svelte/icons/file-orientation";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import { useImageUpload } from "$lib/hooks/use-image-upload.svelte";
  import ImagePlus from "@lucide/svelte/icons/image-plus";
  import Loader2 from "@lucide/svelte/icons/loader-2";

  const profileImageHandler = useImageUpload({
    initialImage: "",
  });

  let profileImageBase64: string | null = null;
  let open = $state(false);

  const form = superForm(page.data.form, {
    id: "create-status-page",
    resetForm: true,
    validators: zod4(formSchema),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        open = false;
        toast.success("Status page created successfully!");
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

  $effect(() => {
    if (profileImageHandler.files?.length) {
      const file = profileImageHandler.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          $formData.image = result.split(",")[1];
          profileImageBase64 = result.split(",")[1];
        }
      };
      reader.readAsDataURL(file);
    } else {
      profileImageBase64 = null;
    }
  });
</script>

<Toaster closeButton position="top-center" />

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      <IconFileOrientation />
    </Empty.Media>
    <Empty.Title class=" text-gray-200">Let’s Get Started</Empty.Title>
    <Empty.Description class="text-gray-400">
      Get started by creating your status page and you’ll be ready to publish in
      no time.
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Dialog.Root bind:open>
        <Dialog.Trigger
          class={cn("cursor-pointer", buttonVariants({ variant: "outline" }))}
          >Create page</Dialog.Trigger
        >
        <Dialog.Content class="bg-zinc-900">
          <form method="POST" class="space-y-5" use:enhance>
            <div class="space-y-4">
              <div class="space-y-2">
                <Form.Field {form} name="image">
                  <Form.Control>
                    {#snippet children({ props })}
                      <input
                        type="hidden"
                        name={props.name}
                        bind:value={$formData.image}
                      />

                      <div class="flex flex-col items-center gap-2">
                        <div
                          class="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
                        >
                          {@render Avatar()}
                        </div>

                        <Dialog.Header>
                          <Dialog.Title
                            class="mt-10 text-gray-300 sm:text-center"
                            >Favicon</Dialog.Title
                          >
                          <Dialog.Description
                            class="text-gray-400 sm:text-center"
                          >
                            Set up your status page.
                          </Dialog.Description>
                        </Dialog.Header>
                      </div>
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>

                <Form.Field {form} name="title">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300"
                        >Title</Form.Label
                      >
                      <Input
                        class="border-zinc-700 text-white"
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
                        class="border-zinc-700 text-white"
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
                        class="border-zinc-700 text-white"
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
                        class="border-zinc-700 text-white"
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
                        class="border-zinc-700 text-white"
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
