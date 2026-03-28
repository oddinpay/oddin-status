<script lang="ts">
  import { goto } from "$app/navigation";
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
    House,
    CalendarCheck,
  } from "lucide-svelte";
  import Header from "$lib/components/Header.svelte";
  // import Incidents from '$lib/components/Incidents.svelte';
  import NotIncidents from "$lib/components/NotIncidents.svelte";
  import { Gauge } from "$lib/components/ui/gauge";
  import Incidents from "$lib/components/Incidents.svelte";

  let currentTab = "tab-2";
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
          onclick={() => goto("/schedules")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <CalendarCheck class="h-8 w-8" />
          <span class="max-[900px]:hidden">Schedules</span>
        </TabsTrigger>

        <TabsTrigger
          value="tab-4"
          onclick={() => goto("/alerts")}
          class="flex w-full cursor-pointer items-center justify-start gap-3 rounded-md py-4 text-2xl font-bold text-white transition data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=inactive]:text-zinc-400 data-[state=inactive]:hover:bg-zinc-800 data-[state=inactive]:hover:text-white max-[900px]:justify-center max-[900px]:p-2 xl:px-6 xl:text-3xl"
        >
          <Siren class="h-8 w-8" />
          <span class="max-[900px]:hidden">Alerts</span>
        </TabsTrigger>
      </TabsList>

      <div
        class="grid w-full grid-cols-1 gap-4 overflow-y-auto px-10 pb-20 900:grid-cols-2"
      >
        <div
          class="relative col-span-1 rounded-lg border border-border bg-zinc-900 p-8 900:col-span-2 900:min-h-120 900:overflow-y-hidden"
        >
          <TabsContent value="tab-2" class="h-auto min-h-75">
            <Tabs value="tab-2" class=" items-center">
              <TabsList
                class="h-auto gap-2 rounded-full border-b border-border bg-zinc-800 px-10 py-2 text-zinc-400"
              >
                <TabsTrigger
                  value="tab-2"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Overview
                </TabsTrigger>

                <TabsTrigger
                  value="tab-3"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Manage
                </TabsTrigger>
              </TabsList>
              <TabsContent value="tab-3">
                <Incidents />
              </TabsContent>
              <TabsContent value="tab-2">
                <NotIncidents />
              </TabsContent>
              <TabsContent value="tab-4">
                <NotIncidents />
              </TabsContent>
              <TabsContent value="tab-5">
                <NotIncidents />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </div>

        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-2" class="h-auto min-h-37.5">
            <p class="text-base font-semibold text-zinc-200">
              Active Incidents
            </p>
            <!-- <Gauge
							colors={{ primary: 'stroke-green-700', secondary: 'stroke-green-200' }}
							class="text-white"
							show_value
							size="lg"
							value={100}
						/> -->
          </TabsContent>
        </div>
        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-2" class="h-auto min-h-37.5">
            <p class="text-base font-semibold text-zinc-200">
              Recent Incidents
            </p>
            <!-- <Gauge
							colors={{ primary: 'stroke-yellow-700', secondary: 'stroke-yellow-200' }}
							class="text-white"
							show_value
							size="lg"
							value={100}
						/> -->
          </TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</div>
