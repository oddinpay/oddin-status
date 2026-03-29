<script lang="ts">
  import * as Item from "$lib/components/ui/item/index.js";
  import Menu from "$lib/components/Menu.svelte";
  import { Globe } from "lucide-svelte";

  let {
    id,
    title,
    description,
  }: { id: string; title: string; description: string } = $props();
</script>

<div class="flex w-full items-center justify-center">
  <Item.Root
    id="card"
    class="bg-zinc-800  w-100 h-[99.25px] border-zinc-700 nokia:w-80 ipse:w-60 sm:w-100 overflow-hidden"
    variant="outline"
  >
    <Item.Media variant="icon">
      <Globe />
    </Item.Media>

    <Item.Content>
      <Item.Title class="text-white truncate">{title}</Item.Title>
      <Item.Description class="text-gray-400 line-clamp-2">
        {description}
      </Item.Description>
    </Item.Content>

    <Item.Actions class="ml-auto">
      <Menu {id} />
    </Item.Actions>
  </Item.Root>
</div>

<svelte:head>
  <style>
    @media (min-width: 220px) and (max-width: 330px) {
      #card {
        width: 200px;
      }
    }
  </style>
</svelte:head>
