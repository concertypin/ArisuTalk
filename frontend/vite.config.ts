/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type PluginOption, type UserConfig, defineConfig, loadEnv } from "vite";
import { playwright } from "@vitest/browser-playwright";
import path from "path";
import { sveltePhosphorOptimize } from "phosphor-svelte/vite";
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
        },
    ],
    headless: true,
    screenshotFailures: false, // Speed up by not taking screenshots
};

const runBrowserTest =
    process.env.npm_lifecycle_event?.includes("browser") ||
    process.env.npm_lifecycle_event?.includes("coverage")
        ? true
        : false;
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
        sveltePhosphorOptimize(),
    ];
    let env = loadEnv(mode, process.cwd(), "") as Record<string, any>;
    env.VITEST_BROWSER_MODE = runBrowserTest ? "true" : "false";

    let coverage: TestConfig["coverage"] & { provider: "v8" } = {
        provider: "v8",
        reporter: ["html", "text"],
        reportsDirectory: "./coverage",
        include: ["src/**/*", "common/**/*"],
        reportOnFailure: true,
        exclude: ["node_modules/", "dist/", "test/", "**/*.d.ts", "**/*.config.*", "static/"],
    };
    if (env.GITHUB_ACTIONS) {
        coverage.reporter = ["json-summary", "text"];
    }
    let testConfig: TestConfig = {
        globals: true,
        environment: "node",
        silent: "passed-only",
        setupFiles: ["./test/setup.ts"],
        exclude: ["node_modules", "dist", ".git", "**/EndToEndHook.test.ts"],
        browser: runBrowserTest ? browserTestConfig : undefined,
        coverage,
        includeTaskLocation: true,
        env,
        typecheck: {
            enabled: true,
        },
        testTimeout: 10000, // 10 seconds global timeout
        fileParallelism: true,
    };

    if (env.GITHUB_ACTIONS) {
        testConfig.reporters = [
            "default",
            [
                "github-actions",
                {
                    onWritePath(path) {
                        return path.replace(/^\/app\//, `${env.GITHUB_WORKSPACE}/`);
                    },
                },
            ],
        ];
    }

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
        define: define,
        build: {
            outDir: "dist",
            sourcemap: true,
            rollupOptions: {
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
