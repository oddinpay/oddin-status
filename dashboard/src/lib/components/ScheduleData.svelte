<script lang="ts">
    import ChevronLeft from "@lucide/svelte/icons/chevron-left";
    import { Search } from "lucide-svelte";
    import { Skeleton } from "$lib/components/ui/skeleton/index.js";
    import ChevronRight from "@lucide/svelte/icons/chevron-right";
    import {
        type ColumnDef,
        type ColumnFiltersState,
        type PaginationState,
        type RowSelectionState,
        type SortingState,
        type VisibilityState,
        getCoreRowModel,
        getFilteredRowModel,
        getPaginationRowModel,
        getSortedRowModel,
    } from "@tanstack/table-core";
    import { createRawSnippet } from "svelte";
    import DataTableCheckbox from "$lib/components/ui/data-table/data-table-checkbox.svelte";
    import DataTableEmailButton from "$lib/components/ui/data-table/data-table-schedule.svelte";
    import DataTableActions from "$lib/components/ScheduleUpdate.svelte";
    import * as Table from "$lib/components/ui/table/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { Input } from "$lib/components/ui/input/index.js";

    import {
        ConfirmDeleteDialog,
        confirmDelete,
    } from "$lib/components/ui/confirm-delete-dialog";

    import {
        FlexRender,
        createSvelteTable,
        renderComponent,
        renderSnippet,
    } from "$lib/components/ui/data-table/index.js";

    import { useQuery } from "convex-svelte";
    import { api } from "../../convex/_generated/api";
    import { env } from "$env/dynamic/public";
    import { toast } from "svelte-sonner";
    import { source } from "sveltekit-sse";
    import { onMount, onDestroy } from "svelte";
    import { browser } from "$app/environment";

    const oddinHost = env.PUBLIC_SSE_HOST;
    let unsubscribe: (() => void) | undefined;

    type StatusType = "up" | "down" | "warn" | "default";

    interface StatusEntry {
        date: Date;
        status: StatusType;
    }

    interface ApiData {
        id?: string;
        name?: string;
        date?: string[];
        state?: string[];
        statuses: StatusEntry[];
        uptime15: string;
        uptime30: string;
        uptime60: string;
        uptime90: string;
        __order?: number;
    }

    onMount(() => {
        if (!browser) return;

        const json = source(`https://${oddinHost}/v1/sse`)
            .select("")
            .json<ApiData>();

        unsubscribe = json.subscribe((msg: any) => {
            const probe = msg?.payload?.probe;
            const sla = msg?.payload?.sla;
            const index = msg?.index;

            if (!probe?.id) return;

            const id = probe.id;

            if (probe.action?.[0] === "deleted") {
                delete probeMap[id];
                return;
            }

            probeMap[id] = {
                ...probeMap[id],
                ...probe,
                uptime90: sla?.uptime90 ?? probeMap[id]?.uptime90 ?? "100.000%",
                __order: index ?? probeMap[id]?.__order ?? Infinity,
            };
        });
    });

    onDestroy(() => {
        unsubscribe?.();
    });

    type ProbeMap = Record<string, ApiData>;
    let probeMap = $state<ProbeMap>({});

    const scheduleCount = useQuery(api.schedules.count, {});
    let totalCount = $state(0);

    $effect(() => {
        if (scheduleCount.data !== undefined) {
            totalCount = scheduleCount.data;
        } else {
            totalCount = 0;
        }
    });

    type Payment = {
        id: string;
        name: string;
    };

    type ConvexMonitor = {
        _id: string;
        name: string;
    };

    type TableRow = Payment & Partial<ConvexMonitor>;

    const apiKey = env.PUBLIC_API_KEY;
    const schedule = useQuery(api.schedules.get, {
        apiKey,
    });

    const data: Payment[] = [];
    const allData = $derived<TableRow[]>([
        ...data,
        ...(schedule.data ?? []).map((m) => ({
            ...m,
            id: m._id,
            name: m.service,
        })),
    ]);

    const columns: ColumnDef<Payment>[] = [
        {
            id: "select",
            header: ({ table }) =>
                renderComponent(DataTableCheckbox, {
                    checked: table.getIsAllPageRowsSelected(),
                    indeterminate:
                        table.getIsSomePageRowsSelected() &&
                        !table.getIsAllPageRowsSelected(),
                    onCheckedChange: (value) =>
                        table.toggleAllPageRowsSelected(!!value),
                    "aria-label": "Select all",
                    class: "border cursor-pointer border-zinc-500 data-[state=checked]:border-none data-[state=checked]:bg-white data-[state=checked]:text-zinc-900",
                }),
            cell: ({ row }) =>
                renderComponent(DataTableCheckbox, {
                    checked: row.getIsSelected(),
                    onCheckedChange: (value) => row.toggleSelected(!!value),
                    "aria-label": "Select row",
                    class: "border cursor-pointer border-zinc-500 data-[state=checked]:border-none data-[state=checked]:bg-white data-[state=checked]:text-zinc-900",
                }),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const id = row.original.id;
                const currentProbe = probeMap[id];

                const statusValue = Array.isArray(currentProbe?.state)
                    ? currentProbe.state[0]
                    : (currentProbe?.state ?? "default");

                const statusSnippet = createRawSnippet<[{ status: string }]>(
                    (getStatus) => {
                        const { status } = getStatus();

                        const themeMap: Record<
                            string,
                            { base: string; ping: string }
                        > = {
                            up: { base: "bg-green-500", ping: "bg-green-400" },
                            down: { base: "bg-red-500", ping: "bg-red-400" },
                            warn: {
                                base: "bg-yellow-500",
                                ping: "bg-yellow-400",
                            },
                            default: { base: "bg-white", ping: "bg-zinc-300" },
                        };

                        const theme = themeMap[status] ?? themeMap.default;

                        return {
                            render: () => `
                <div class="flex justify-center items-center">
                  <span class="relative flex size-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 ${theme.ping}"></span>
                    <span class="relative inline-flex rounded-full size-2 ${theme.base}"></span>
                  </span>
                </div>
              `,
                        };
                    },
                );

                return renderSnippet(statusSnippet, {
                    status: statusValue,
                });
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) =>
                renderComponent(DataTableEmailButton, {
                    onclick: column.getToggleSortingHandler(),
                }),
            cell: ({ row }) => {
                const emailSnippet = createRawSnippet<[{ name: string }]>(
                    (getName) => {
                        const { name } = getName();
                        return {
                            render: () =>
                                `<div class="truncate max-w-[150px]">${name}</div>`,
                        };
                    },
                );

                return renderSnippet(emailSnippet, {
                    name: row.original.name,
                });
            },
        },

        {
            id: "actions",
            header: ({ table }) => {
                return renderComponent(Button, {
                    variant: "outline",
                    size: "icon",
                    class: "size-8 bg-transparent cursor-pointer text-red-500 hover:bg-red-950/30 hover:text-red-400 disabled:opacity-30 transition-color disabled:pointer-events-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500",
                    disabled:
                        table.getFilteredSelectedRowModel().rows.length === 0,
                    onclick: () => {
                        const selectedRows = table.getSelectedRowModel().rows;
                        const selectedIds = selectedRows.map(
                            (row) => row.original.id,
                        );

                        const isBulk = selectedIds.length > 1;

                        confirmDelete({
                            title: isBulk
                                ? "Delete monitors"
                                : "Delete monitor",
                            description:
                                "Are you sure you want to delete this monitor? This action cannot be undone.",
                            input: {
                                confirmationText: "yes",
                            },
                            onConfirm: async () => {
                                const formData = new FormData();

                                const action = isBulk
                                    ? "?/deleteBulk"
                                    : "?/delete";

                                if (!isBulk) {
                                    formData.append("_id", selectedIds[0]);
                                } else {
                                    formData.append(
                                        "_id",
                                        JSON.stringify(selectedIds),
                                    );
                                }

                                formData.append("confirmation", "yes");
                                const response = await fetch(action, {
                                    method: "POST",
                                    body: formData,
                                });

                                if (response.ok) {
                                    toast.success(
                                        "Monitor deleted successfully.",
                                    );
                                } else {
                                    toast.error("Failed to delete.");
                                }
                            },
                        });
                    },
                    children: createRawSnippet(() => ({
                        render: () =>
                            `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
`,
                    })),
                });
            },
            cell: ({ row }) =>
                renderComponent(DataTableActions, {
                    id: row.original.id,
                    name: row.original.name,
                }),
            enableHiding: false,
        },
    ];

    let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 4 });
    let sorting = $state<SortingState>([]);
    let columnFilters = $state<ColumnFiltersState>([]);
    let rowSelection = $state<RowSelectionState>({});
    let columnVisibility = $state<VisibilityState>({});

    const table = createSvelteTable({
        get data() {
            return allData;
        },
        getRowId: (row) => row.id,
        columns,
        state: {
            get pagination() {
                return pagination;
            },
            get sorting() {
                return sorting;
            },
            get columnVisibility() {
                return columnVisibility;
            },
            get rowSelection() {
                return rowSelection;
            },
            get columnFilters() {
                return columnFilters;
            },
        },
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onPaginationChange: (updater) => {
            if (typeof updater === "function") {
                pagination = updater(pagination);
            } else {
                pagination = updater;
            }
        },
        onSortingChange: (updater) => {
            if (typeof updater === "function") {
                sorting = updater(sorting);
            } else {
                sorting = updater;
            }
        },
        onColumnFiltersChange: (updater) => {
            if (typeof updater === "function") {
                columnFilters = updater(columnFilters);
            } else {
                columnFilters = updater;
            }
        },
        onColumnVisibilityChange: (updater) => {
            if (typeof updater === "function") {
                columnVisibility = updater(columnVisibility);
            } else {
                columnVisibility = updater;
            }
        },
        onRowSelectionChange: (updater) => {
            if (typeof updater === "function") {
                rowSelection = updater(rowSelection);
            } else {
                rowSelection = updater;
            }
        },
    });
</script>

<svelte:head>
    <style>
        tbody tr:hover td {
            background-color: #3f3f46;
            color: white;
        }

        thead tr:hover th {
            background-color: #3f3f46;
            color: white;
        }

        thead tbody tr td,
        thead tr th {
            transition: background-color 0.2s ease;
        }

        thead tr th:last-child,
        tbody tr td:last-child {
            width: 1%;
            white-space: nowrap;
            padding-right: 1rem;
        }

        button:disabled {
            cursor: not-allowed !important;
            pointer-events: auto !important;
            opacity: 0.5;
        }

        th:nth-child(1),
        td:nth-child(1),
        th:nth-child(2),
        td:nth-child(2),
        th:last-child,
        td:last-child {
            text-align: center;
        }
    </style>
</svelte:head>

<div class="-mb-8 w-full">
    <div class="flex items-center justify-end py-4">
        <div class="relative">
            <Search
                class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
                id="table-search"
                placeholder="Filter schedules..."
                value={(table.getColumn("name")?.getFilterValue() as string) ??
                    ""}
                oninput={(e) =>
                    table
                        .getColumn("name")
                        ?.setFilterValue(e.currentTarget.value)}
                onchange={(e) => {
                    table
                        .getColumn("name")
                        ?.setFilterValue(e.currentTarget.value);
                }}
                class="max-w-sm bg-zinc-800 w-50 border-zinc-700 text-white pl-8"
            />
        </div>
        <DropdownMenu.Root>
            <DropdownMenu.Content align="end">
                {#each table
                    .getAllColumns()
                    .filter((col) => col.getCanHide()) as column (column)}
                    <DropdownMenu.CheckboxItem
                        class="capitalize cursor-pointer"
                        bind:checked={
                            () => column.getIsVisible(),
                            (v) => column.toggleVisibility(!!v)
                        }
                    >
                        {column.id}
                    </DropdownMenu.CheckboxItem>
                {/each}
            </DropdownMenu.Content>
        </DropdownMenu.Root>
        <ConfirmDeleteDialog />
    </div>
    <div class="rounded-md">
        <Table.Root class="stm:w-100">
            <Table.Header>
                {#if schedule.isLoading}
                    <Table.Row>
                        {#each columns as _}
                            <Table.Head
                                class="text-white border-b border-zinc-700  cursor-pointer hover:bg-zinc-800 [&:has([role=checkbox])]:ps-3"
                            >
                                <Skeleton class="h-8 w-full bg-zinc-700/50" />
                            </Table.Head>
                        {/each}
                    </Table.Row>
                {:else}
                    {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
                        <Table.Row>
                            {#each headerGroup.headers as header (header.id)}
                                <Table.Head
                                    class="text-white border-b border-zinc-700  cursor-pointer hover:bg-zinc-800 [&:has([role=checkbox])]:ps-3"
                                >
                                    {#if !header.isPlaceholder}
                                        <FlexRender
                                            content={header.column.columnDef
                                                .header}
                                            context={header.getContext()}
                                        />
                                    {/if}
                                </Table.Head>
                            {/each}
                        </Table.Row>
                    {/each}
                {/if}
            </Table.Header>
            <Table.Body>
                {#if schedule.isLoading}
                    {#each Array(totalCount) as _}
                        <Table.Row>
                            {#each columns as _}
                                <Table.Cell
                                    class="text-white border-b border-zinc-700 cursor-pointer hover:bg-zinc-800 [&:has([role=checkbox])]:ps-3"
                                >
                                    <Skeleton
                                        class="h-8 w-full bg-zinc-700/50"
                                    />
                                </Table.Cell>
                            {/each}
                        </Table.Row>
                    {/each}
                {:else if table.getFilteredRowModel().rows.length === 0}
                    <Table.Row>
                        <Table.Cell
                            colspan={columns.length}
                            class="h-24 text-white text-center"
                        >
                            No results.
                        </Table.Cell>
                    </Table.Row>
                {/if}
                {#each table.getRowModel().rows as row (row.id)}
                    <Table.Row
                        data-state={row.getIsSelected() && "selected"}
                        class="data-[state=selected]:bg-zinc-700/50"
                    >
                        {#each row.getVisibleCells() as cell (cell.id)}
                            <Table.Cell
                                class="text-white border-b border-zinc-700 cursor-pointer hover:bg-zinc-800 [&:has([role=checkbox])]:ps-3"
                            >
                                <FlexRender
                                    content={cell.column.columnDef.cell}
                                    context={cell.getContext()}
                                />
                            </Table.Cell>
                        {/each}
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
    <div class="flex items-center justify-end space-x-2 pt-4">
        <div class="text-muted-foreground flex-1 text-sm">
            {table.getFilteredSelectedRowModel().rows.length} of
            {table.getFilteredRowModel().rows.length} schedule(s) selected.
        </div>
        <div class="flex items-center space-x-2">
            <Button
                variant="outline"
                size="icon"
                class="size-8 bg-zinc-800 border-zinc-700 hover:text-white text-white hover:bg-zinc-700 hover:cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                onclick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                <ChevronLeft class="size-4" />
                <span class="sr-only">Previous page</span>
            </Button>

            <Button
                variant="outline"
                size="icon"
                class="size-8 bg-zinc-800 border-zinc-700 hover:text-white text-white hover:bg-zinc-700 hover:cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
                onclick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                <ChevronRight class="size-4" />
                <span class="sr-only">Next page</span>
            </Button>
        </div>
    </div>
</div>
