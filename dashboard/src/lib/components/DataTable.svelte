<script lang="ts">
  import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import { Search } from "lucide-svelte";
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
  import DataTableEmailButton from "$lib/components/ui/data-table/data-table-email-button.svelte";
  import DataTableActions from "$lib/components/ui/data-table/data-table-actions.svelte";
  import * as Table from "$lib/components/ui/table/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import {
    FlexRender,
    createSvelteTable,
    renderComponent,
    renderSnippet,
  } from "$lib/components/ui/data-table/index.js";

  import { useQuery } from "convex-svelte";
  import { api } from "../../convex/_generated/api";
  import { env } from "$env/dynamic/public";

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

  const monitors = useQuery(api.status.get, {
    apiKey,
  });

  const data: Payment[] = [];

  const allData = $derived<TableRow[]>([
    ...data,
    ...(monitors.data ?? []).map((m) => ({
      ...m,
      id: m._id,
      name: m.name,
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
          onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
          class:
            "border cursor-pointer border-zinc-500 data-[state=checked]:border-none data-[state=checked]:bg-white data-[state=checked]:text-zinc-900",
        }),
      cell: ({ row }) =>
        renderComponent(DataTableCheckbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value) => row.toggleSelected(!!value),
          "aria-label": "Select row",
          class:
            "border cursor-pointer border-zinc-500 data-[state=checked]:border-none data-[state=checked]:bg-white data-[state=checked]:text-zinc-900",
        }),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const statusSnippet = createRawSnippet<[{ status: string }]>(
          (getStatus) => {
            const { status } = getStatus();
            return {
              render: () => `<div class="capitalize">${status}</div>`,
            };
          },
        );
        return renderSnippet(statusSnippet, {
          status: row.original.name.includes("www") ? "up" : "down",
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
        const emailSnippet = createRawSnippet<[{ name: string }]>((getName) => {
          const { name } = getName();
          return {
            render: () =>
              `<div class="lowercase truncate max-w-[150px]">${name}</div>`,
          };
        });

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
          class:
            "size-8 bg-transparent cursor-pointer text-red-500 hover:bg-red-950/30 hover:text-red-400 disabled:opacity-30 transition-color disabled:pointer-events-none disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500",
          disabled: table.getFilteredSelectedRowModel().rows.length === 0,
          onclick: () => {
            const selectedIds = table
              .getSelectedRowModel()
              .rows.map((row) => row.original.id);
            console.log("Delete items:", selectedIds);
            // Your deletion logic here
          },
          children: createRawSnippet(() => ({
            render: () =>
              `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
`,
          })),
        });
      },
      cell: ({ row }) =>
        renderComponent(DataTableActions, { id: row.original.id }),
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
  </style>
</svelte:head>

<div class="-mb-8 w-full">
  <div class="flex items-center justify-end py-4">
    <div class="relative">
      <Search
        class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
      />
      <Input
        placeholder="Filter monitors..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        oninput={(e) =>
          table.getColumn("name")?.setFilterValue(e.currentTarget.value)}
        onchange={(e) => {
          table.getColumn("name")?.setFilterValue(e.currentTarget.value);
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
              () => column.getIsVisible(), (v) => column.toggleVisibility(!!v)
            }
          >
            {column.id}
          </DropdownMenu.CheckboxItem>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>
  <div class="rounded-md">
    <Table.Root class="stm:w-100">
      <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <Table.Row>
            {#each headerGroup.headers as header (header.id)}
              <Table.Head
                class="text-white border-b border-zinc-700  cursor-pointer hover:bg-zinc-800 [&:has([role=checkbox])]:ps-3"
              >
                {#if !header.isPlaceholder}
                  <FlexRender
                    content={header.column.columnDef.header}
                    context={header.getContext()}
                  />
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        {/each}
      </Table.Header>
      <Table.Body>
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
        {:else}
          <Table.Row>
            <Table.Cell
              colspan={columns.length}
              class="h-24 text-white text-center"
            >
              No results.
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </div>
  <div class="flex items-center justify-end space-x-2 pt-4">
    <div class="text-muted-foreground flex-1 text-sm">
      {table.getFilteredSelectedRowModel().rows.length} of
      {table.getFilteredRowModel().rows.length} monitor(s) selected.
    </div>
    <div class="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        class="size-8 bg-zinc-800 border-zinc-700 hover:text-white text-white hover:bg-zinc-700 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft class="size-4" />
        <span class="sr-only">Previous page</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        class="size-8 bg-zinc-800 border-zinc-700 hover:text-white text-white hover:bg-zinc-700 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-50"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRight class="size-4" />
        <span class="sr-only">Next page</span>
      </Button>
    </div>
  </div>
</div>
