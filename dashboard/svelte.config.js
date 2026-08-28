// import adapter from "@sveltejs/adapter-node";
// import adapter from "@jesterkit/exe-sveltekit";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { preprocessMeltUI, sequence } from "@melt-ui/pp";
import adapter from "@sveltejs/adapter-node";

// const adapterOptions = { precompress: true };

const config = {
  extensions: [".svelte", ".svx", ".md"],
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    adapter: adapter(),

    alias: {
      $assets: "./src/lib/assets",
      $data: "./src/lib/data",
      $helpers: "./src/lib/helpers",
      $lib: "./src/lib",
    },
  },
};

export default config;
