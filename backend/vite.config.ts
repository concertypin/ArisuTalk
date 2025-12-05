/// <reference types="vitest/config" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineWorkersConfig((ctx) => {
    const isTestMode = ctx.mode === "test";
    const config = {
        plugins: [!isTestMode && cloudflare(), tsconfigPaths()],
        server: {
            cors: false, // https://hono.dev/docs/middleware/builtin/cors#using-with-vite
            allowedHosts: true,
        },
        build: {
            sourcemap: true,
            lib: {
                entry: "src/main.ts",
                formats: ["es"],
            },
            rollupOptions: {
                output: {
                    //Everything in a single file for Cloudflare Workers
                    manualChunks: () => "bundle",
                },
            },
            outDir: "dist",
        },
        test: {
            poolOptions: {
                workers: {
                    wrangler: { configPath: "./wrangler.jsonc" },
                },
            },
        },
        preview: { port: 5179 },
        clearScreen: false,
    } satisfies import("vitest/config").ViteUserConfig;
    return config;
});
