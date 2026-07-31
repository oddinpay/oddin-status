import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],

  ssr: {
    noExternal: ["@better-svelte-email/preview"],
  },

  build: {
    rollupOptions: {
      external: ["cloudflare:workers"],
    },
  },

  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
    },
  },
});
