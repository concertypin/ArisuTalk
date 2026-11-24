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
            // Svelte component tests. jsdom + Testing Library, no real browser.
            plugins: [
                // Auto cleanup between tests, and the `browser` resolve condition so that
                // Svelte's client build (with `mount`) is used instead of the server build.
                // Scoped to this project so the Node-based unit tests keep Svelte's default resolution.
                svelteTesting(),
            ],
            test: {
                name: "dom",
                environment: "jsdom",
                include: ["test/dom/**/*.test.ts"],
                setupFiles: ["./test/setup.dom.ts"],
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
