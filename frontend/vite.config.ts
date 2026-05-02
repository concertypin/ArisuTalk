/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type PluginOption, type UserConfig, defineConfig } from "vite";
import { testConfig } from "./scripts/testConfig";
import path from "path";

type Presence<T> = T extends undefined ? never : T;

const paths: Presence<UserConfig["resolve"]>["alias"] = {
    "@": path.resolve(__dirname, "src"),
    "@worker": path.resolve(__dirname, "worker"),
    "@test": path.resolve(__dirname, "test"),
    "@common": path.resolve(__dirname, "common"),
};

export default defineConfig(async (ctx) => {
    const mode = ctx.mode;
    const plugin: PluginOption[] = [
        svelte({
            compilerOptions: {
                dev: mode !== "production",
            },
        }),
    ];
    /*
    // Requirements for vite's env
    // oxlint-disable-next-line typescript/no-explicit-any
    const env = loadEnv(mode, process.cwd(), "") as Record<string, any>;
    */

    const define: Record<string, string> = {};
    const baseConfig: UserConfig = {
        optimizeDeps: {
            include: [
                "cbor-x",
                // Pre-include these to prevent Vite from re-optimizing during tests
                // which causes flaky test failures due to unexpected reloads
                "@langchain/core/language_models/chat_models",
                "@langchain/core/messages",
                "@langchain/core/outputs",
                "phosphor-svelte/lib/*",
            ],
        },
        resolve: {
            alias: paths,
        },
        server: {
            sourcemapIgnoreList(absSourcePath) {
                if (absSourcePath.includes("node_modules")) return true;
                if (absSourcePath.includes(".pnpm")) return true;
                if (absSourcePath.includes("@vite")) return true;
                return false;
            },
            headers: {
                // COOP/COEP, for better Performance.now() resolution
                "Cross-Origin-Embedder-Policy": "require-corp",
                "Cross-Origin-Opener-Policy": "same-origin",
            },
            open: "index.html",
            allowedHosts: process.env.npm_lifecycle_event?.includes("dev") ? true : undefined,
        },
        define,
        build: {
            outDir: "dist",
            sourcemap: true,
            rolldownOptions: {
                checks: {
                    circularDependency: true,
                    pluginTimings: false,
                },
                output: {
                    sourcemapIgnoreList(relativeSourcePath) {
                        if (relativeSourcePath.includes("node_modules")) return true;
                        if (relativeSourcePath.includes(".pnpm")) return true;
                        return false;
                    },
                },
            },
        },
        worker: {
            format: "es", // Force ES module workers
        },
        clearScreen: false,
        publicDir: "static",
        plugins: plugin,
        test: testConfig,
    };
    return baseConfig;
});
