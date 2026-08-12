<script lang="ts">
  import "../app.css";
  import "@fontsource-variable/inter";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { setupConvex } from "convex-svelte";
  import { setupConvexAuth } from "@mmailaender/convex-auth-svelte/sveltekit";
  import { Toaster } from "svelte-sonner";
  import { Progress } from "@friendofsvelte/progress";

  // Import data from +layout.server.ts
  let { children, data } = $props();

  setupConvex(PUBLIC_CONVEX_URL);
  setupConvexAuth({ getServerState: () => data.authState });
</script>

<Progress size="sm" class="progress-bar-inner" />
<Toaster closeButton position="top-center" />

{@render children?.()}
