/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type PluginOption, UserConfig, defineConfig, loadEnv } from "vite";
import checker from "vite-plugin-checker";
import { comlink } from "vite-plugin-comlink";
import tsconfigPaths from "vite-tsconfig-paths";

import getEnvVar from "./script/envbuild";
import vitePWA from "./script/pwa";

// Since it distracts debugging via service worker, enable it only on production build
const prodOnlyPlugin = [vitePWA];
declare const process: {
    cwd: () => string;
};

const predefinedChunks: Record<string, string[]> = {
    "vendor-core": ["svelte", "svelte/internal"],
    "vendor-ui": ["lucide-svelte"],
    "vendor-utils": ["jszip"],
};

export default defineConfig(async (ctx) => {
    const mode = ctx.mode;
    const env = loadEnv(mode, process.cwd(), "");
    const defines: Record<string, any> = {
        // General env vars, since it will be typed on vite-env.d.ts
        ...getEnvVar(ctx, env),
    };

    const defineConfigReady = Object.fromEntries(
        Object.entries(defines).map(([k, v]) => [
            `import.meta.env.${k}`,
            JSON.stringify(v),
        ])
    );
    const plugin: PluginOption[] = [
        tsconfigPaths(),

        checker({
            /**
             * @todo The error should be fixed, since there's so many errors now. Disabled for now since it works anyway.
             */
            typescript: env.STRICT
                ? { tsconfigPath: "./tsconfig.json" }
                : false,
        }),
        comlink(),
        svelte({
            compilerOptions: {
                dev: mode !== "production",
            },
        }),
        ...(mode === "production" ? prodOnlyPlugin : []),
    ];
    let baseConfig: UserConfig = {
        server: {
            open: "index.html",
        },
        worker: {
            plugins: () => [comlink()],
        },
        build: {
            outDir: "dist",
            sourcemap: "inline",
            rollupOptions: {
                output: {
                    manualChunks: predefinedChunks,
                    sourcemapIgnoreList(relativePath) {
                        return relativePath.includes("node_modules");
                    },
                },
            },
        },
        clearScreen: false,
        publicDir: "static",
        plugins: plugin,
        define: defineConfigReady,
        test: {
            globals: true,
            environment: "happy-dom",
            setupFiles: ["./tests/setup.ts"],
            include: ["tests/**/*.{test,spec}.{js,ts}"],
            exclude: ["node_modules", "dist"],
            coverage: {
                reporter: ["text", "json", "html"],
                exclude: [
                    "node_modules/",
                    "dist/",
                    "tests/",
                    "**/*.d.ts",
                    "**/*.config.*",
                    "script/",
                    "static/",
                    "worker/",
                ],
            },
        },
    };
    return baseConfig;
});
