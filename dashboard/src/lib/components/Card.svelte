<script lang="ts">
  import * as Item from "$lib/components/ui/item/index.js";
  import ShieldAlertIcon from "@lucide/svelte/icons/shield-alert";
  import Menu from "$lib/components/Menu.svelte";
</script>

<div class="flex w-full max-w-lg flex-col gap-6">
  <Item.Root class="bg-zinc-800 border-zinc-700" variant="outline">
    <Item.Media variant="icon">
      <ShieldAlertIcon />
    </Item.Media>
    <Item.Content>
      <Item.Title class="text-white">Security Alert</Item.Title>
      <Item.Description class="text-gray-400">
        New login detected from unknown device.
      </Item.Description>
    </Item.Content>
    <Item.Actions>
      <Menu />
    </Item.Actions>
  </Item.Root>
</div>
