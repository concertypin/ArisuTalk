/// <reference types="vitest/config"/>
import { type UserConfig } from "vite";
import { playwright } from "@vitest/browser-playwright";
type Presence<T> = T extends undefined ? never : T;

type TestConfig = Presence<UserConfig["test"]>;

const browserTestConfig: TestConfig["browser"] = {
    enabled: true,
    provider: playwright(),
    instances: [
        {
            hideSkippedTests: true,
            browser: "chromium",
            testTimeout: 20 * 1000,
            expect: {
                poll: {
                    timeout: 500,
                },
            },
        },
    ],

    headless: true,
    screenshotFailures: false, // Speed up by not taking screenshots
};
const coverage: TestConfig["coverage"] & { provider: "v8" } = {
    provider: "v8",
    reporter: ["html", "text", "json-summary"],
    reportsDirectory: "./coverage",
    include: ["src/**/*.ts", "src/**/*.svelte", "common/**/*.ts", "worker/**/*.ts"],
    reportOnFailure: true,
    exclude: ["node_modules/", "dist/", "test/", "**/*.d.ts", "**/*.config.*", "static/"],
    enabled: true,
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
    projects: [
        {
            test: {
                name: "browser",
                browser: browserTestConfig,
                include: ["test/browser/**/*.test.ts"],
                env: {
                    VITEST_BROWSER_MODE: "true",
                },
            },
            extends: true,
        },
        {
            test: {
                name: "unit",
                include: ["features", "integration", "lib", "unit", "utils", "workers"].map(
                    (i) => `test/${i}/**/*.test.ts`
                ),
            },
            extends: true,
        },
    ],
};
