<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { useAuth } from "@mmailaender/convex-auth-svelte/sveltekit";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import { BookOpenText } from "lucide-svelte";
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "$lib/components/ui/avatar";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdowns";

  import { Skeleton } from "$lib/components/ui/skeleton/index.js";
  import { useQuery } from "convex-svelte";
  import { api } from "../../../../convex/_generated/api";

  const user = useQuery(api.users.get, {});
  const { signOut } = useAuth();
  let loading = $derived(user.isLoading || !user.data);

  function handleClick() {
    window.open("https://github.com/oddinpay/ohstatus", "_blank", "noreferrer");
  }
</script>

{#if loading}
  <Avatar>
    <Skeleton
      class="bg-zinc-700  flex size-full items-center justify-center rounded-[inherit]"
    ></Skeleton>
  </Avatar>
{:else}
  <DropdownMenu>
    <DropdownMenuTrigger>
      {#snippet child({ props })}
        <Button
          variant="ghost"
          class="h-auto cursor-pointer rounded-full p-0 hover:bg-transparent hover:opacity-80"
          {...props}
        >
          <Avatar>
            <AvatarImage src={user.data?.image} alt="Profile image" />
            <AvatarFallback>{user.data?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      {/snippet}
    </DropdownMenuTrigger>
    <DropdownMenuContent class="max-w-64 bg-zinc-700" align="end">
      <DropdownMenuLabel class="flex min-w-0  flex-col">
        <span class="truncate text-sm font-medium text-zinc-100"
          >{user.data?.name}</span
        >
        <span class="truncate text-xs font-normal text-zinc-300">
          {user.data?.email}
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator class="bg-zinc-600" />
      <DropdownMenuGroup>
        <DropdownMenuSeparator class="bg-zinc-600" />
        <DropdownMenuItem
          onclick={() => {
            handleClick();
          }}
          class="cursor-pointer text-zinc-100 focus:bg-zinc-600 focus:text-white"
        >
          <BookOpenText size={16} class="opacity-80" aria-hidden="true" />
          <span>Docs</span>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator class="bg-zinc-600" />
      <DropdownMenuItem
        onclick={() => signOut()}
        class="cursor-pointer text-zinc-100 focus:bg-zinc-600 focus:text-white"
      >
        <LogOutIcon size={16} class="opacity-80" aria-hidden="true" />
        <span>Sign out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}
