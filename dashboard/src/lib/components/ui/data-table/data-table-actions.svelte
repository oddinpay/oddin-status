<script lang="ts">
  import MoreHorizontal from "@lucide/svelte/icons/more-horizontal";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { toast } from "svelte-sonner";
  import { formUpdate } from "$lib/types/form";
  import { page } from "$app/state";
  import {
    ConfirmDeleteDialog,
    confirmDelete,
  } from "$lib/components/ui/confirm-delete-dialog";

  import { useQuery } from "convex-svelte";
  import { api } from "../../../../convex/_generated/api";

  const query = useQuery(api.site.get);

  let { id }: { id: string } = $props();

  let open = $state(false);

  const form = superForm(page.data.form, {
    id: "update-monitor",
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
</script>

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
