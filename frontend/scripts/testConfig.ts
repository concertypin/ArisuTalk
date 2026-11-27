import "vitest/config";
import { type UserConfig } from "vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import type { TestProjectInlineConfiguration as TestProject } from "vitest/config";
type Presence<T> = T extends undefined ? never : T;

type TestConfig = Presence<UserConfig["test"]>;

const coverage: TestConfig["coverage"] & { provider: "v8" } = {
    provider: "v8",
    reporter: ["html", "text", "json-summary"],
    reportsDirectory: "./coverage",
    include: ["src/**/*.ts", "src/**/*.svelte", "common/**/*.ts", "worker/**/*.ts"],
    reportOnFailure: true,
    exclude: [
        "node_modules/",
        "dist/",
        "test/",
        "**/*.d.ts",
        "**/*.config.*",
        "static/",
        // Example worker is a template reference, not actual production code.
        // Kept as a reference for creating new workers; excluded from coverage.
        "worker/example/**",
        // Deprecated sticker code, removed together with stickers. The image generation store and panel
        // save results into sticker packs and are rewritten to save chat inlays at the same time.
        // Remove these entries when those files are deleted or rewritten.
        "src/features/sticker/components/StickerPackManager.svelte",
        "src/features/sticker/stores/stickerStore.svelte.ts",
        "src/lib/adapters/storage/sticker/IDBStickerAdapter.ts",
        "src/features/imagegen/components/ImageGenerator.svelte",
        "src/features/imagegen/stores/imageGenStore.svelte.ts",
    ],
    enabled: true,
};
const noPluginTiming: TestProject["build"] = {
    rolldownOptions: {
        checks: {
            pluginTimings: false,
        },
    },
};
export const testConfig: TestConfig = {
    globals: true,
    environment: "node",
    silent: "passed-only",
    setupFiles: ["./test/setup.ts"],
    exclude: ["node_modules", "dist", ".git"],
    coverage,
    includeTaskLocation: true,
    testTimeout: 10000, // 10 seconds global timeout
    fileParallelism: true,
    execArgv: ["--no-experimental-webstorage"],

    projects: [
        {
            // Svelte component tests in jsdom with Testing Library (no Chromium).
            plugins: [
                // Adds auto cleanup and the `browser` condition (Svelte's client build, with `mount`).
                // Scoped here so the Node-based unit tests keep the default resolution.
                svelteTesting(),
            ],
            test: {
                name: "browser",
                environment: "jsdom",
                include: ["test/browser/**/*.test.ts"],
                setupFiles: ["./test/setup.browser.ts"],
                sequence: {
                    groupOrder: 0,
                },
            },
            build: noPluginTiming,
            extends: true,
        },
        {
            test: {
                name: "unit",
                include: ["features", "integration", "lib", "unit", "utils", "workers"].map(
                    (i) => `test/${i}/**/*.test.ts`
                ),
                sequence: {
                    groupOrder: 0,
                },
            },
            build: noPluginTiming,
            extends: true,
        },
    ],
};
