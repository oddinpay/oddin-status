<script lang="ts">
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
  import { goto } from "$app/navigation";
  let currentTab = "tab-4";
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
      class="flex max-h-[calc(100dvh-3rem)] w-full flex-col gap-8 900:flex-row"
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
          <TabsContent value="tab-4" class="h-auto min-h-75">
            <Tabs value="tab-3" class=" items-center">
              <TabsList
                class="h-auto gap-2 rounded-full border-b border-border bg-zinc-800 px-10 py-2 text-zinc-400"
              >
                <!-- <TabsTrigger
                  value="tab-3"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Rules
                </TabsTrigger> -->

                <TabsTrigger
                  value="tab-3"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Integrations
                </TabsTrigger>
              </TabsList>
              <!-- <TabsContent value="tab-3">
                <Alerts />
              </TabsContent> -->
              <TabsContent value="tab-4">
                <p class="p-4 text-center text-xs text-white">
                  Content for Tab 4
                </p>
              </TabsContent>
              <TabsContent value="tab-3">
                <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    class="flex h-80 w-30 360:w-60 xl:w-80 flex-col overflow-hidden rounded-xl border border-zinc-700 shadow-sm"
                  >
                    <div class="flex-1 p-6">
                      <h3 class="font-medium text-zinc-300">Email</h3>
                    </div>
                    <div class="border-t p-4"></div>
                  </div>

                  <div
                    class="flex h-80 w-30 360:w-60 xl:w-80 flex-col overflow-hidden rounded-xl border border-zinc-700 shadow-sm"
                  >
                    <div class="flex-1 p-6">
                      <h3 class="font-medium text-zinc-300">RSS</h3>
                    </div>
                    <div class="border-t p-4"></div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </div>
        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-4" class="h-auto min-h-37.5">
            <p class="text-base font-extralight text-zinc-200">
              Total Subscribers
            </p>
          </TabsContent>
        </div>

        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-4" class="h-auto min-h-37.5">
            <p class="text-base font-extralight text-zinc-200">Recent Alerts</p>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</div>
