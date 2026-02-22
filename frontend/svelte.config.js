import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig}*/
export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),
    vitePlugin: {
        inspector: {
            showToggleButton: "always",
            toggleButtonPos: "bottom-right",
        },
    },
    compilerOptions: { runes: true },
};
