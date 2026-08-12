<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import Button from "$lib/components/ui/button.svelte";
  import BellIcon from "@lucide/svelte/icons/bell";
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "$lib/components/ui/popover";
  import { api } from "../../../../convex/_generated/api";
  import { env } from "$env/dynamic/public";
  import { useQuery, useConvexClient } from "convex-svelte";

  const query = useQuery(api.notifications.get);

  const client = useConvexClient();
  const API_KEY = env.PUBLIC_API_KEY;

  const initialNotifications: Array<{
    id: string;
    action: string;
    timestamp: string;
    unread: boolean;
  }> = [];

  let notifications = $state([...initialNotifications]);
  const unreadCount = $derived(notifications.filter((n) => n.unread).length);

  function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    // Less than 10 seconds
    if (seconds < 10) return "just now";

    // Less than 1 minute
    if (seconds < 60) return `${seconds}s ago`;

    // Minutes
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    // Hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

    // Days
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

    // Weeks
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

    // Months
    const months = Math.floor(days / 30);
    if (months < 12)
      return months === 1 ? "a month ago" : `${months} months ago`;

    return "a long time ago";
  }

  $effect(() => {
    if (query.data) {
      const convexData = query.data.map((n) => ({
        id: n._id,
        action: n.note,
        target: n.status,
        timestamp: formatTimeAgo(n._creationTime),
        unread: !n.seen,
      }));

      notifications = [...convexData, ...initialNotifications];
    }
  });

  async function handleMarkAllAsRead() {
    notifications.forEach((n) => (n.unread = false));

    try {
      await client.mutation(api.notifications.markAllAsRead, {
        apiKey: API_KEY ?? "",
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function handleNotificationClick(notificationId: string) {
    notifications.forEach((n) => {
      if (n.id === notificationId) n.unread = false;
    });

    try {
      await client.mutation(api.notifications.markAsRead, {
        apiKey: API_KEY ?? "",
        id: notificationId as any,
      });
    } catch (error) {
      console.error(error);
    }
  }
</script>

<Popover>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button
        size="icon"
        variant="ghost"
        class="size- relative cursor-pointer rounded-full text-zinc-100 shadow-none hover:bg-zinc-600 hover:text-zinc-100"
        aria-label="Open notifications"
        {...props}
      >
        <BellIcon size={16} aria-hidden="true" />

        {#if unreadCount > 0}
          <div
            aria-hidden="true"
            class="absolute top-0.5 right-0.5 size-1 rounded-full bg-green-300"
          ></div>
        {/if}
      </Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent class="w-80 bg-zinc-700 p-1 text-white">
    <div class="flex items-baseline justify-between gap-4 px-3 py-2">
      <div class="text-sm font-semibold">Notifications</div>
      {#if unreadCount > 0}
        <button
          class="cursor-pointer text-xs font-medium hover:underline"
          onclick={handleMarkAllAsRead}
        >
          Mark all as read
        </button>
      {/if}
    </div>
    <div
      role="separator"
      aria-orientation="horizontal"
      class="-mx-1 my-1 h-px bg-zinc-600"
    ></div>
    {#each notifications as notification (notification.id)}
      <div
        class="rounded-md px-3 py-2 text-sm transition-colors hover:bg-zinc-600"
      >
        <div class="relative flex items-start pe-3">
          <div class="flex-1 space-y-1">
            <button
              class="cursor-pointer text-left text-zinc-100 after:absolute after:inset-0"
              onclick={() => handleNotificationClick(notification.id)}
            >
              <span class="font-medium text-zinc-100 hover:underline"> </span>
              {notification.action}
              <span class="font-medium text-zinc-100 hover:underline"> </span>
            </button>
            <div class="text-xs text-zinc-300">
              {notification.timestamp}
            </div>
          </div>
          {#if notification.unread}
            <div class="absolute inset-e-0 self-center">
              <span class="sr-only">Unread</span>
              {@render Dot({})}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </PopoverContent>
</Popover>

{#snippet Dot({ className }: { className?: ClassValue })}
  <svg
    width="6"
    height="6"
    fill="#86efac"
    viewBox="0 0 6 6"
    xmlns="http://www.w3.org/2000/svg"
    class={className}
    aria-hidden="true"
  >
    <circle cx="3" cy="3" r="3" />
  </svg>
{/snippet}
