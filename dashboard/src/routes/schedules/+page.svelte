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
  import Schedules from "$lib/components/Schedules.svelte";
  import NotSchedules from "$lib/components/NotSchedules.svelte";
  import { Gauge } from "$lib/components/ui/gauge";
  import { useQuery } from "convex-svelte";
  import { api } from "../../convex/_generated/api";
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import ScheduleData from "$lib/components/ScheduleData.svelte";

  let currentTab = "tab-3";
  let requestID: number;
  let totalCount = $state(0);
  const scheduleCount = useQuery(api.schedules.count, {});
  const statusCounts = useQuery(api.schedules.getStatusCounts, {});
  let timer: ReturnType<typeof setTimeout>;
  let unsubscribe: (() => void) | undefined;

  $effect(() => {
    if (scheduleCount.data !== undefined) {
      totalCount = scheduleCount.data;
    } else {
      totalCount = 0;
    }
  });

  function getCtx(id: string) {
    const container = document.getElementById(`canvas-${id}`);
    if (!container) return null;
    container.innerHTML = "";

    const canvas = document.createElement("canvas");
    const dpr = window.devicePixelRatio || 1;

    const rect = container.getBoundingClientRect();
    const size = rect.width;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    ctx.scale(dpr, dpr);

    const internalScale = size / 180;
    ctx.scale(internalScale, internalScale);

    container.appendChild(canvas);
    return ctx;
  }

  function setupPulsingGrid() {
    const ctx = getCtx("pulsing-grid");
    if (!ctx) return;
    const animate = (ts: number) => {
      let time = ts * 0.001;
      ctx.clearRect(0, 0, 180, 180);
      const bF = Math.sin(time * 0.5) * 0.2 + 1.0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (r === 2 && c === 2) continue;
          const bX = (c - 2) * 15,
            bY = (r - 2) * 15;
          const dist = Math.sqrt(bX * bX + bY * bY);
          const a = Math.atan2(bY, bX);
          const rW = Math.sin((time - dist / 80) * Math.PI * 2) * 4;
          const x = 90 + bX * bF + Math.cos(a) * rW;
          const y = 90 + bY * bF + Math.sin(a) * rW;
          ctx.fillStyle = `rgba(200, 220, 255, ${0.5 + Math.sin(time * 1.5 + a * 3) * 0.2})`;
          ctx.beginPath();
          ctx.arc(
            x,
            y,
            (1.5 + (1 - dist / 80) * 1.5) *
              (Math.sin(time * 2 + (dist / 80) * 5) * 0.6 + 1),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
      requestID = requestAnimationFrame(animate);
    };
    requestID = requestAnimationFrame(animate);
  }

  const animations = [
    { id: "pulsing-grid", title: "Loading", setup: setupPulsingGrid },
  ];

  onMount(() => {
    if (!browser) return;

    animations.forEach((a) => a.setup());
    timer = setTimeout(setupPulsingGrid, 60);
    return () => {
      if (timer) clearTimeout(timer);
      if (requestID) cancelAnimationFrame(requestID);
    };
  });

  onDestroy(() => {
    if (timer) clearTimeout(timer);
    if (requestID) cancelAnimationFrame(requestID);
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
        class="sticky top-6 flex w-80 flex-col gap-2 self-start bg-transparent px-4 max-[900px]:top-0 max-[900px]:z-50 max-[900px]:w-full max-[900px]:flex-row max-[900px]:justify-around max-[900px]:bg-black/80 max-[900px]:backdrop-blur-md"
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
          <TabsContent value="tab-3" class="h-auto min-h-75">
            <Tabs value="tab-5" class=" items-center">
              <TabsList
                class="h-auto gap-2 rounded-full border-b border-border bg-zinc-800 px-10 py-2 text-zinc-400"
              >
                <TabsTrigger
                  value="tab-5"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="tab-6"
                  class="relative cursor-pointer after:absolute  after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5  hover:text-white hover:after:bg-white data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:after:bg-white data-[state=active]:hover:text-white"
                >
                  Schedule
                </TabsTrigger>
              </TabsList>

              <TabsContent
                class="flex items-center hover:opacity-95 justify-center min-h-50"
                value="tab-5"
              >
                {#if scheduleCount.isLoading}
                  <div class="container pb-20">
                    {#each animations as anim}
                      <div id="canvas-{anim.id}" class="circle-container"></div>
                    {/each}
                  </div>
                {:else if scheduleCount.error}
                  <NotSchedules />
                {:else if totalCount > 0}
                  <ScheduleData />
                {:else}
                  <NotSchedules />
                {/if}
              </TabsContent>
              <TabsContent value="tab-6">
                <Schedules />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </div>
        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-3" class="h-auto min-h-37.5">
            <p class="text-base font-extralight text-zinc-200">Maintenance</p>

            <Gauge
              colors={{
                primary: "stroke-yellow-700",
                secondary: "stroke-yellow-200",
              }}
              class="text-white"
              show_value
              size="lg"
              value={statusCounts.data?.inprogress ?? 0}
            />
          </TabsContent>
        </div>

        <div
          class="min-h-62.5 rounded-lg border border-border bg-zinc-900 p-8 900:overflow-y-hidden"
        >
          <TabsContent value="tab-3" class="h-auto min-h-37.5">
            <p class="text-base font-extralight text-zinc-200">Schedules</p>

            <Gauge
              colors={{
                primary: "stroke-gray-700",
                secondary: "stroke-gray-200",
              }}
              class="text-white"
              show_value
              size="lg"
              value={statusCounts.data?.scheduled ?? 0}
            />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</div>

<style>
  .circle-container {
    width: 180px;
    height: 180px;
    max-width: 90%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
    transform: translate3d(0, 0, 0);
    will-change: transform;
  }
</style>
