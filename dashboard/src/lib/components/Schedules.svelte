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
  import { DateRangePicker } from "bits-ui";
  import CalendarBlank from "phosphor-svelte/lib/CalendarBlankIcon";
  import CaretLeft from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";

  const id = $props.id();

  const incidents = [
    { class: "text-gray-500", label: "Scheduled", value: "Scheduled" },
    // { class: "text-yellow-500", label: "In Progress", value: "Inprogress" },
    // { class: "text-emerald-600", label: "Completed", value: "Completed" },
    // { class: "text-red-500", label: "Cancelled", value: "Cancelled" },
  ] as const;

  let open = $state(false);
  let name = $state("");
  let service = $state("");
  let bioLimit = useCharacterLimit(180, "");

  const selected = $derived(
    incidents.find((i) => i.value === $formData.status),
  );

  $effect(() => {
    const serviceName = service.trim().toUpperCase();
    name = serviceName
      ? `Scheduled maintenance for ${serviceName}`
      : "Scheduled maintenance for API";

    $formData.title = name;
    $formData.service = service;
  });

  $effect(() => {
    const name = service.trim().toUpperCase() || "API";

    if ($formData.status === "Inprogress") {
      bioLimit.value =
        "Scheduled maintenance is currently in progress. We will provide updates as necessary.";
    } else if ($formData.status === "Completed") {
      bioLimit.value = "The scheduled maintenance has been completed.";
    } else if ($formData.status === "Cancelled") {
      bioLimit.value = "The scheduled maintenance has been cancelled.";
    } else {
      bioLimit.value = `${name} has an upcoming scheduled maintenance. We will provide updates as necessary.`;
    }
  });

  const form = superForm(page.data.form, {
    id: "create-schedule",
    resetForm: true,
    validators: zod4(scheduleCreate),
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
    },
    onUpdate: async ({ form: f }) => {
      if (f.valid) {
        service = "";
        name = "";
        bioLimit.value = "";
        open = false;
        toast.success("Schedule created successfully!");
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

  const isLocked = $derived(
    $formData.status === "Inprogress" ||
      $formData.status === "Completed" ||
      $formData.status === "Cancelled" ||
      $formData.status === "Scheduled",
  );

  $effect(() => {
    $formData.note = bioLimit.value;
  });
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
      <Dialog.Root bind:open>
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

          <form method="POST" class="space-y-5" use:enhance>
            <div class="space-y-4">
              <div class="space-y-2">
                <Form.Field {form} name="service">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300" for="service"
                        >Service</Form.Label
                      >
                      <Input
                        class=" border-zinc-700 text-white"
                        placeholder="API"
                        type="text"
                        {...props}
                        bind:value={service}
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
                      <Form.Label class="font-bold text-gray-300" for="title"
                        >Title</Form.Label
                      >
                      <Input
                        class=" border-zinc-700 text-white"
                        placeholder="Scheduled maintenance for API"
                        type="text"
                        readonly
                        {...props}
                        bind:value={name}
                      />
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <DateRangePicker.Root
                  weekdayFormat="short"
                  fixedWeeks={true}
                  class="flex w-full max-w-85  flex-col gap-1.5"
                >
                  <DateRangePicker.Label
                    class="block font-bold text-gray-300 select-none text-sm"
                    >Datetime</DateRangePicker.Label
                  >
                  <div
                    class="h-input border border-zinc-700 hover:border hover:border-zinc-700 text-white rounded-input bg-transparent flex w-full select-none items-center px-2 py-3 text-sm tracking-[0.01em]"
                  >
                    {#each ["start", "end"] as const as type (type)}
                      <DateRangePicker.Input {type}>
                        {#snippet children({ segments })}
                          {#each segments as { part, value }, i (part + i)}
                            <div class="inline-block select-none">
                              {#if part === "literal"}
                                <DateRangePicker.Segment
                                  {part}
                                  class="text-muted-foreground p-1"
                                >
                                  {value}
                                </DateRangePicker.Segment>
                              {:else}
                                <DateRangePicker.Segment
                                  {part}
                                  class="rounded-5px hover:bg-zinc-700 focus:bg-zinc-700 focus:text-white aria-[valuetext=Empty]:text-muted-foreground focus-visible:ring-0! focus-visible:ring-offset-0! px-1 py-1"
                                >
                                  {value}
                                </DateRangePicker.Segment>
                              {/if}
                            </div>
                          {/each}
                        {/snippet}
                      </DateRangePicker.Input>
                      {#if type === "start"}
                        <div
                          aria-hidden="true"
                          class="text-muted-foreground px-1"
                        >
                          –⁠⁠⁠⁠⁠
                        </div>
                      {/if}
                    {/each}

                    <DateRangePicker.Trigger
                      class="text-foreground/60  hover:bg-zinc-700 active:bg-dark-10 ml-auto inline-flex size-8 items-center justify-center rounded-5px"
                    >
                      <CalendarBlank
                        class="size-6 cursor-pointer hover:opacity-85 text-white hover:text-white"
                      />
                    </DateRangePicker.Trigger>
                  </div>
                  <DateRangePicker.Content
                    side="left"
                    align="center"
                    sideOffset={-35}
                    class="z-50 cursor-pointer ipse:data-[state=open]:scale-85 md:data-[state=open]:scale-95 data-[state=open]:scale-85"
                  >
                    <DateRangePicker.Calendar
                      class="rounded-15px border-dark-10 bg-background-alt shadow-popover mt-6 border stm:p-5 p-2"
                    >
                      {#snippet children({ months, weekdays })}
                        <DateRangePicker.Header
                          class="flex items-center justify-between"
                        >
                          <DateRangePicker.PrevButton
                            class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
                          >
                            <CaretLeft class="size-6" />
                          </DateRangePicker.PrevButton>
                          <DateRangePicker.Heading
                            class="text-[15px] font-medium"
                          />
                          <DateRangePicker.NextButton
                            class="rounded-9px bg-background-alt hover:bg-muted inline-flex size-10 items-center justify-center transition-all active:scale-[0.98]"
                          >
                            <CaretRight class="size-6" />
                          </DateRangePicker.NextButton>
                        </DateRangePicker.Header>
                        <div
                          class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0"
                        >
                          {#each months as month (month.value)}
                            <DateRangePicker.Grid
                              class="w-full border-collapse select-none space-y-1"
                            >
                              <DateRangePicker.GridHead>
                                <DateRangePicker.GridRow
                                  class="mb-1 flex w-full justify-between"
                                >
                                  {#each weekdays as day (day)}
                                    <DateRangePicker.HeadCell
                                      class="text-muted-foreground font-normal! w-10 rounded-md text-xs"
                                    >
                                      <div>{day.slice(0, 2)}</div>
                                    </DateRangePicker.HeadCell>
                                  {/each}
                                </DateRangePicker.GridRow>
                              </DateRangePicker.GridHead>
                              <DateRangePicker.GridBody>
                                {#each month.weeks as weekDates (weekDates)}
                                  <DateRangePicker.GridRow class="flex w-full">
                                    {#each weekDates as date (date)}
                                      <DateRangePicker.Cell
                                        {date}
                                        month={month.value}
                                        class="p-0! relative m-0 size-10 overflow-visible text-center text-sm focus-within:relative focus-within:z-20"
                                      >
                                        <DateRangePicker.Day
                                          class="rounded-9px text-foreground hover:border-foreground focus-visible:ring-foreground! data-selection-end:rounded-9px data-selection-start:rounded-9px data-highlighted:bg-muted data-selected:bg-muted data-selection-end:bg-foreground data-selection-start:bg-foreground data-disabled:text-foreground/30 data-selected:text-foreground data-selection-end:text-background data-selection-start:text-background data-unavailable:text-muted-foreground data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:border-foreground data-disabled:pointer-events-none data-highlighted:rounded-none  data-outside-month:pointer-events-none data-selected:font-medium data-selection-end:font-medium data-selection-start:font-medium data-selection-start:focus-visible:ring-2 data-selection-start:focus-visible:ring-offset-2! data-unavailable:line-through data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:rounded-none data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:ring-0! data-selected:[&:not([data-selection-start])]:[&:not([data-selection-end])]:focus-visible:ring-offset-0! group relative inline-flex size-10 items-center justify-center overflow-visible whitespace-nowrap border border-transparent bg-transparent p-0 text-sm font-normal transition-all"
                                        >
                                          <div
                                            class="bg-foreground group-data-selected:bg-background group-data-today:block absolute top-1.25 hidden size-1 rounded-full transition-all"
                                          ></div>
                                          {date.day}
                                        </DateRangePicker.Day>
                                      </DateRangePicker.Cell>
                                    {/each}
                                  </DateRangePicker.GridRow>
                                {/each}
                              </DateRangePicker.GridBody>
                            </DateRangePicker.Grid>
                          {/each}
                        </div>
                      {/snippet}
                    </DateRangePicker.Calendar>
                  </DateRangePicker.Content>
                </DateRangePicker.Root>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="status">
                  <Form.Control>
                    {#snippet children({ props })}
                      <Form.Label class="font-bold text-gray-300" for="status"
                        >Status</Form.Label
                      >

                      <input
                        type="hidden"
                        name="status"
                        bind:value={$formData.status}
                      />
                      <Select.Root type="single" bind:value={$formData.status}>
                        <Select.Trigger
                          {...props}
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
                    {/snippet}
                  </Form.Control>
                  <Form.FieldErrors />
                </Form.Field>
              </div>

              <div class="space-y-2">
                <Form.Field {form} name="note">
                  <Form.Control>
                    {#snippet children({ props })}
                      <div class="*:not-first:mt-2">
                        <Label class="font-bold text-gray-300" for="note"
                          >Note</Label
                        >
                        <Textarea
                          {...props}
                          id="note"
                          class=" border-zinc-700 text-white"
                          bind:value={bioLimit.value}
                          maxlength={bioLimit.maxLength}
                          placeholder="Write a few sentences about incident..."
                          aria-describedby="{id}-left-textarea"
                          readonly={isLocked}
                          required
                        />
                        <p
                          class="mt-2 text-right text-xs text-muted-foreground"
                          role="status"
                          aria-live="polite"
                        >
                          <span class="tabular-nums"
                            >{bioLimit.maxLength -
                              bioLimit.characterCount}</span
                          >
                          characters left
                        </p>
                      </div>
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
