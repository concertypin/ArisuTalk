/// <reference types="vitest/config" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { type PluginOption, UserConfig, defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { playwright } from "@vitest/browser-playwright";
type Presence<T> = T extends undefined ? never : T;

const browserTestConfig: Presence<UserConfig["test"]>["browser"] = {
    enabled: true,
    provider: playwright(),
    instances: [
        {
            browser: "chromium",
            testTimeout: 15 * 1000,
        },
    ],
    headless: true,
};

const runBrowserTest = process.env.npm_lifecycle_event?.includes("browser") ? true : false;

export default defineConfig(async (ctx) => {
    const mode = ctx.mode;
    const plugin: PluginOption[] = [
        tsconfigPaths(),
        svelte({
            compilerOptions: {
                dev: mode !== "production",
            },
        }),
    ];
    const env = loadEnv(mode, process.cwd(), "");
    let testConfig: UserConfig["test"] = {
        globals: true,
        environment: "happy-dom",
        setupFiles: ["./test/setup.ts"],
        exclude: ["node_modules", "dist", ".git"],
        browser: runBrowserTest ? browserTestConfig : undefined,
        coverage: {
            reporter: ["text", "json", "html"],
            include: ["src/**/*", "test/**/*"],
            exclude: ["node_modules/", "dist/", "test/", "**/*.d.ts", "**/*.config.*", "static/"],
        },
        includeTaskLocation: true,
        env,
        typecheck: {
            enabled: true,
        },
    };
    const define: Record<string, string> = {};
    const baseConfig: UserConfig = {
        server: {
            sourcemapIgnoreList(absSourcePath) {
                if (absSourcePath.includes("node_modules")) return true;
                if (absSourcePath.includes(".pnpm")) return true;
                if (absSourcePath.includes("@vite")) return true;
                return false;
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
