<script lang="ts">
  import { goto } from "$app/navigation";
  import Header from "$lib/components/Header.svelte";
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "$lib/components/ui/tabs";
  import {
    SquareActivity,
    Siren,
    ShieldAlert,
    CalendarCheck,
    House,
  } from "lucide-svelte";
  import { Gauge } from "$lib/components/ui/gauge";
  import Page from "$lib/components/Page.svelte";
  import NotPage from "$lib/components/NotPage.svelte";
  import * as Item from "$lib/components/ui/item/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import Card from "$lib/components/Card.svelte";
  import { useQuery } from "convex-svelte";
  import { api } from "../convex/_generated/api";

  let currentTab = "tab-0";
  const query = useQuery(api.site.get);
  let siteLive = $state(false);

  $effect(() => {
    if (query.data && query.data.length > 0) {
      siteLive = true;
    } else {
      siteLive = false;
    }
  });
</script>

<div
  class="flex min-h-screen items-start justify-center overflow-hidden bg-black"
>
  <div class="fixed mx-auto w-full max-w-7xl py-4">
    <div class="px-4 py-4">
      <Header />
    </div>

    <Tabs
      value={currentTab}
      class="flex max-h-[calc(100dvh-3rem)]  w-full flex-col gap-8 900:flex-row"
    >
      <TabsList
        class="sticky top-6 flex w-80 flex-col gap-2 self-start bg-transparent p-4 max-[900px]:top-0 max-[900px]:z-50 max-[900px]:w-full max-[900px]:flex-row max-[900px]:justify-around max-[900px]:bg-black/80 max-[900px]:backdrop-blur-md"
      >
        <TabsTrigger
          value="tab-0"
          onclick={() => goto("/")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <House class="h-8 w-8" />
          <span class="max-[900px]:hidden">Home</span>
        </TabsTrigger>

        <TabsTrigger
          value="tab-1"
          onclick={() => goto("/monitors")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <SquareActivity class="h-8 w-8" />
          <span class="max-[900px]:hidden">Monitors</span>
        </TabsTrigger>

        <TabsTrigger
          value="tab-2"
          onclick={() => goto("/incidents")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <ShieldAlert class="h-8 w-8" />
          <span class="max-[900px]:hidden">Incidents</span>
        </TabsTrigger>

        <TabsTrigger
          value="tab-3"
          onclick={() => goto("/alerts")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <Siren class="h-8 w-8" />
          <span class="max-[900px]:hidden">Alerts</span>
        </TabsTrigger>

        <TabsTrigger
          value="tab-4"
          onclick={() => goto("/schedules")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <CalendarCheck class="h-8 w-8" />
          <span class="max-[900px]:hidden">Schedules</span>
        </TabsTrigger>
      </TabsList>

      <div
        class="grid w-full grid-cols-1 gap-4 overflow-y-auto px-10 pb-20 900:grid-cols-2"
      >
        <div
          class="relative col-span-1 rounded-lg border border-border bg-zinc-900 p-8 900:col-span-2 900:min-h-120 900:overflow-y-hidden"
        >
          <TabsContent value="tab-0" class="h-auto min-h-75">
            <Tabs value="tab-1" class=" items-center">
              <TabsList
                class="h-auto gap-2 rounded-full border-b border-border bg-zinc-800 px-10 py-2 text-zinc-400"
              >
                <TabsTrigger
                  value="tab-1"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="tab-2"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Page
                </TabsTrigger>
              </TabsList>
              <TabsContent
                class="flex items-center justify-center min-h-50"
                value="tab-1"
              >
                {#if query.isLoading}
                  Loading...
                {:else if query.error}
                  failed to load: {query.error.toString()}
                {:else if siteLive}
                  {#each query.data as site}
                    <Card title={site.title} description={site.description} />
                  {/each}
                {:else}
                  <NotPage />
                {/if}
              </TabsContent>

              <TabsContent value="tab-2">
                <Page />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </div>
        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-0" class="h-auto min-h-37.5">
            <p class="text-base font-semibold text-zinc-200">Total Monitors</p>
            <Gauge
              colors={{
                primary: "stroke-green-600",
                secondary: "stroke-green-200",
              }}
              class="text-white"
              show_value
              size="lg"
              value={100}
            />
          </TabsContent>
        </div>

        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-0" class="h-auto min-h-37.5">
            <p class="text-base font-semibold text-zinc-200">Total Incidents</p>
            <Gauge
              colors={{
                primary: "stroke-amber-600",
                secondary: "stroke-amber-200",
              }}
              class="text-white"
              show_value
              size="lg"
              value={100}
            />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</div>
