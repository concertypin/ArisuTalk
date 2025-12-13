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
            headless: true,
        },
    ],
};
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
    const baseConfig: UserConfig = {
        server: {
            open: "index.html",
        },
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
        test: {
            globals: true,
            environment: "happy-dom",
            setupFiles: ["./test/setup.ts"],
            include: ["test/**/*.{test,spec}.{js,ts}"],
            exclude: ["node_modules", "dist"],
            browser:
                process.env.npm_lifecycle_event?.includes("browser") ||
                process.env.npm_lifecycle_event?.includes("ui")
                    ? browserTestConfig
                    : undefined,
            coverage: {
                reporter: ["text", "json", "html"],
                exclude: [
                    "node_modules/",
                    "dist/",
                    "test/",
                    "**/*.d.ts",
                    "**/*.config.*",
                    "static/",
                ],
            },
        },
    };
    return baseConfig;
});
