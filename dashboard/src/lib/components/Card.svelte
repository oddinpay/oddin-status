<script lang="ts">
  import * as Item from "$lib/components/ui/item/index.js";
  import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
  import Menu from "$lib/components/Menu.svelte";

  export let title: string;
  export let description: string;
</script>

<div class="flex w-full items-center justify-center">
  <Item.Root
    id="card"
    class="bg-zinc-800 border-zinc-700 nokia:w-80 ipse:w-60 sm:w-100 overflow-hidden"
    variant="outline"
  >
    <Item.Media variant="icon">
      <ShieldAlertIcon />
    </Item.Media>

    <Item.Content>
      <Item.Title class="text-white truncate">{title}</Item.Title>
      <Item.Description class="text-gray-400 line-clamp-2">
        {description}
      </Item.Description>
    </Item.Content>

    <Item.Actions>
      <Menu />
    </Item.Actions>
  </Item.Root>
</div>

<svelte:head>
  <style>
    @media (min-width: 220px) and (max-width: 350px) {
      #card {
        width: 200px;
      }
    }
  </style>
</svelte:head>
