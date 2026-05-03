<script lang="ts">
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import Input from "$lib/components/ui/input.svelte";
    import Label from "$lib/components/ui/label.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Form from "$lib/components/ui/form/index.js";
    import * as Select from "$lib/components/ui/select/index.js";
    import { CalendarCheck } from "lucide-svelte";
    import { useCharacterLimit } from "$lib/hooks/use-character-limit.svelte";
    import Textarea from "$lib/components/ui/textarea.svelte";
    import { page } from "$app/state";
    import { superForm } from "sveltekit-superforms";
    import { zod4 } from "sveltekit-superforms/adapters";
    import { toast } from "svelte-sonner";
    import { scheduleCreate2 } from "$lib/types/form";
    import Loader2 from "@lucide/svelte/icons/loader-2";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
    import {
        ConfirmDeleteDialog,
        confirmDelete,
    } from "$lib/components/ui/confirm-delete-dialog";

    import { useQuery } from "convex-svelte";
    import { api } from "../../convex/_generated/api";

    const incidents = [
        { class: "text-gray-500", label: "Scheduled", value: "Scheduled" },
        { class: "text-yellow-500", label: "In Progress", value: "Inprogress" },
        { class: "text-emerald-600", label: "Completed", value: "Completed" },
        { class: "text-red-500", label: "Cancelled", value: "Cancelled" },
    ] as const;

    let {
        id,
        name,
        service,
        parentId,
        status: statusProp,
    }: {
        id: string;
        name: string;
        service: string;
        parentId: string;
        status: string;
    } = $props();

    const visibleIncidents = $derived(() => {
        if (isParentLocked) {
            return incidents.filter((i) => i.value === statusProp);
        }

        if (statusProp === "Inprogress") {
            return incidents.filter((i) => i.value === "Completed");
        } else if (statusProp === "Scheduled") {
            return incidents.filter(
                (i) => i.value === "Inprogress" || i.value === "Cancelled",
            );
        } else if (statusProp === "Cancelled") {
            return incidents.filter((i) => i.value === "Cancelled");
        } else if (statusProp === "Completed") {
            return incidents.filter((i) => i.value === "Completed");
        }
        return incidents;
    });

    let open = $state(false);
    let bioLimit = useCharacterLimit(180, "");
    const scheduleCount = useQuery(api.schedules.get, {});

    const isParentLocked = $derived.by(() => {
        if (!scheduleCount.data) return false;

        const relatedSchedules = scheduleCount.data.filter(
            (s) => s.parentId === parentId,
        );

        const hasInProgress = relatedSchedules.some(
            (s) => s.status === "Inprogress",
        );
        const hasCompleted = relatedSchedules.some(
            (s) => s.status === "Completed",
        );
        const hasCancelled = relatedSchedules.some(
            (s) => s.status === "Cancelled",
        );

        const groupIsActiveOrDone =
            hasInProgress || hasCompleted || hasCancelled;

        if (statusProp === "Scheduled" && groupIsActiveOrDone) {
            return true;
        }

        if (statusProp === "Inprogress" && hasCompleted) {
            return true;
        }

        return statusProp === "Completed" || statusProp === "Cancelled";
    });

    $effect(() => {
        if (isParentLocked) {
            if (statusProp === "Scheduled") {
                $formData.status = "Scheduled";
            } else if (statusProp === "Completed") {
                $formData.status = "Completed";
            } else if (statusProp === "Inprogress") {
                $formData.status = "Inprogress";
            } else if (statusProp === "Cancelled") {
                $formData.status = "Cancelled";
            }
            return;
        }

        if (statusProp === "Scheduled") {
            $formData.status = "Inprogress";
        } else if (statusProp === "Inprogress") {
            $formData.status = "Completed";
        } else if (statusProp) {
            $formData.status = statusProp;
        }
    });

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
        if (!open || $submitting) return;

        if ($formData.status === "Inprogress") {
            bioLimit.value =
                "Scheduled maintenance is currently in progress. We will provide updates as necessary.";
        } else if ($formData.status === "Completed") {
            bioLimit.value = "The scheduled maintenance has been completed.";
        } else if ($formData.status === "Cancelled") {
            bioLimit.value = "The scheduled maintenance has been cancelled.";
        } else if ($formData.status === "Scheduled") {
            bioLimit.value = `Scheduled maintenance for ${service}`;
        }
    });

    const uid = $props.id();
    const form = superForm(page.data.form, {
        id: `update-schedule-${uid}`,
        resetForm: true,
        validators: zod4(scheduleCreate2),
        onSubmit: async () => {
            await new Promise((resolve) => setTimeout(resolve, 800));
        },
        onUpdate: async ({ form: f }) => {
            if (f.valid) {
                service = "";
                name = "";
                bioLimit.value = "";
                open = false;
                toast.success("Schedule updated successfully!");
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
    $formData.status = "Inprogress";

    const isLocked = $derived(
        $formData.status === "Inprogress" ||
            $formData.status === "Completed" ||
            $formData.status === "Cancelled",
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

<Dialog.Root bind:open>
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
                    >Update Schedule</Dialog.Title
                >
                <Dialog.Description class="text-gray-400 sm:text-center">
                    Update your schedule settings.
                </Dialog.Description>
            </Dialog.Header>
        </div>

        <form method="POST" class="space-y-5" use:enhance>
            <div class="space-y-4">
                <div class="space-y-2">
                    <Form.Field {form} name="parentId">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Form.Label
                                    class="font-bold text-gray-300"
                                    for="parentId">ID</Form.Label
                                >
                                <Input
                                    class=" border-zinc-700 text-zinc-300"
                                    placeholder="sc_23kq140p62ena8trgd66m8342n"
                                    type="text"
                                    readonly
                                    {...props}
                                    bind:value={parentId}
                                />
                            {/snippet}
                        </Form.Control>
                        <Form.FieldErrors />
                    </Form.Field>
                </div>

                <div class="space-y-2">
                    <Form.Field {form} name="service">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Form.Label
                                    class="font-bold text-gray-300"
                                    for="service">Service</Form.Label
                                >
                                <Input
                                    class=" border-zinc-700 text-zinc-300"
                                    placeholder="API"
                                    type="text"
                                    readonly
                                    {...props}
                                    bind:value={service}
                                />
                            {/snippet}
                        </Form.Control>
                        <Form.FieldErrors />
                    </Form.Field>
                </div>

                <div class="space-y-2">
                    <Form.Field {form} name="status">
                        <Form.Control>
                            {#snippet children({ props })}
                                <Form.Label
                                    class="font-bold text-gray-300"
                                    for="status">Status</Form.Label
                                >

                                <input
                                    type="hidden"
                                    name="status"
                                    bind:value={$formData.status}
                                />
                                <Select.Root
                                    type="single"
                                    bind:value={$formData.status}
                                >
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
                                        {#each visibleIncidents() as item (item.value)}
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
                                    <Label
                                        class="font-bold text-gray-300"
                                        for="note">Note</Label
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
                    formaction="?/update"
                    class="mt-2 w-full cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
                    type="submit"
                    variant="outline"
                    disabled={$submitting || isParentLocked}
                    >{#if $submitting}
                        <Loader2 class="size-4 animate-spin" />
                    {:else}
                        Update
                    {/if}
                </Form.Button>
            </div>
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
