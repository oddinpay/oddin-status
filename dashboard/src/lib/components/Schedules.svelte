<script lang="ts">
  import Button, { buttonVariants } from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import Label from "$lib/components/ui/label.svelte";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
  import * as Form from "$lib/components/ui/form/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { CalendarCheck } from "lucide-svelte";
  import * as Empty from "$lib/components/ui/empty/index.js";
  import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
  import { useCharacterLimit } from "$lib/hooks/use-character-limit.svelte";
  import Textarea from "$lib/components/ui/textarea.svelte";
  import { page } from "$app/state";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import { scheduleCreate } from "$lib/types/form";
  import Loader2 from "@lucide/svelte/icons/loader-2";

  const id = $props.id();

  const incidents = [
    { class: "text-emerald-600", label: "Completed", value: "i1" },
    { class: "text-yellow-500", label: "In Progress", value: "i2" },
    { class: "text-red-500", label: "Cancelled", value: "i3" },
    { class: "text-gray-500", label: "Scheduled", value: "i4" },
  ] as const;

  let open = $state(false);
  let value = $state("i4");
  let name = $state("");
  let service = $state("");
  let bioLimit = useCharacterLimit(180, "");

  function handleOnSubmit(e: Event) {
    e.preventDefault();
  }

  const selected = $derived(incidents.find((i) => i.value === value));
  $effect(() => {
    const name = service.trim().toUpperCase() || "API";

    if (value === "i2") {
      bioLimit.value =
        "Scheduled maintenance is currently in progress. We will provide updates as necessary.";
    } else if (value === "i1") {
      bioLimit.value = "The scheduled maintenance has been completed.";
    } else if (value === "i3") {
      bioLimit.value = "The scheduled maintenance has been cancelled.";
    } else {
      bioLimit.value = `${name} has an upcoming scheduled maintenance. We will provide updates as necessary.`;
    }
  });

  // Check if the input should be disabled
  const isLocked = $derived(value === "i2" || value === "i1");

  const form = superForm(page.data.form, {
    id: "create-schedule",
    resetForm: true,
    validators: zod4(scheduleCreate),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        open = false;
        toast.success($formData.name + " created successfully!");
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
</script>

{#snippet status(item: (typeof incidents)[number])}
  <span class="flex items-center gap-2">
    <svg
      width="8"
      height="8"
      fill="currentColor"
      viewBox="0 0 8 8"
      xmlns="http://www.w3.org/2000/svg"
      class={item.class}
      aria-hidden="true"
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
    <span class="truncate">{item.label}</span>
  </span>
{/snippet}

<Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      <CalendarCheck />
    </Empty.Media>
    <Empty.Title class=" text-gray-200">Let’s Get Started</Empty.Title>
    <Empty.Description class="text-gray-400">
      Get started by creating a schedule, and you’ll receive real-time updates.
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <div class="flex gap-2">
      <Dialog.Root>
        <Dialog.Trigger
          class={cn("cursor-pointer", buttonVariants({ variant: "outline" }))}
          >Create schedule</Dialog.Trigger
        >
        <Dialog.Content class="bg-zinc-900">
          <div class="flex flex-col items-center gap-2">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <CalendarCheck class="h-10 w-10 text-white" />
            </div>

            <Dialog.Header>
              <Dialog.Title class=" text-gray-300 sm:text-center"
                >Create New Schedule</Dialog.Title
              >
              <Dialog.Description class="text-gray-400 sm:text-center">
                Create a schedule to inform future events.
              </Dialog.Description>
            </Dialog.Header>
          </div>

          <form onsubmit={handleOnSubmit} class="space-y-5">
            <div class="space-y-4">
              <div class="space-y-2">
                <Label class="font-bold text-gray-300" for="title">Title</Label>
                <Input
                  class=" border-zinc-700 text-white"
                  id="title"
                  placeholder="Scheduled maintenance"
                  type="text"
                  bind:value={name}
                />
              </div>

              <div class="space-y-2">
                <Label class="font-bold text-gray-300" for="service"
                  >Service</Label
                >
                <Input
                  class=" border-zinc-700 text-white"
                  id="service"
                  placeholder="API"
                  type="text"
                  bind:value={service}
                />
              </div>

              <div class="space-y-2">
                <Label class="font-bold text-gray-300" for="status"
                  >Status</Label
                >
                <Select.Root type="single" bind:value>
                  <Select.Trigger
                    id="status"
                    class="w-full cursor-pointer border-zinc-700 text-white [&_svg:not([class*='text-'])]:text-zinc-200 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0"
                  >
                    {#if selected}
                      {@render status(selected)}
                    {:else}
                      Select a status
                    {/if}
                  </Select.Trigger>
                  <Select.Content
                    class="bg-zinc-800  text-white [&_*[data-select-item]]:ps-2 [&_*[data-select-item]]:pe-8 [&_*[data-select-item]>span]:start-auto [&_*[data-select-item]>span]:inset-e-2 [&_*[data-select-item]>span]:flex [&_*[data-select-item]>span]:items-center [&_*[data-select-item]>span]:gap-2 [&_*[data-select-item]>span>svg]:shrink-0"
                  >
                    {#each incidents as item (item.value)}
                      <Select.Item
                        class="cursor-pointer data-highlighted:bg-zinc-700 data-highlighted:text-white [&_svg:not([class*='text-'])]:text-gray-500"
                        value={item.value}
                      >
                        {@render status(item)}
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </div>

              <div class="space-y-2">
                <div class="*:not-first:mt-2">
                  <Label class="font-bold text-gray-300" for="{id}-note"
                    >Note</Label
                  >
                  <Textarea
                    id="{id}-note"
                    class=" border-zinc-700 text-white"
                    bind:value={bioLimit.value}
                    maxlength={bioLimit.maxLength}
                    placeholder="Write a few sentences about incident..."
                    aria-describedby="{id}-left-textarea"
                    readonly={isLocked}
                    required
                  />
                  <p
                    id="{id}-left-textarea"
                    class="mt-2 text-right text-xs text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <span class="tabular-nums"
                      >{bioLimit.maxLength - bioLimit.characterCount}</span
                    >
                    characters left
                  </p>
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
                  Create
                {/if}
              </Form.Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  </Empty.Content>
  <Button variant="link" class="text-gray-400" size="sm">
    <a
      href="https://github.com/oddinpay/oddin-status"
      target="_blank"
      rel="noopener noreferrer"
    >
      Learn More <ArrowUpRightIcon class="inline" />
    </a>
  </Button>
</Empty.Root>
