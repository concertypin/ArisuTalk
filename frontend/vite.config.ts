import { defineConfig, loadEnv, UserConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tsconfigPaths from "vite-tsconfig-paths";
import getEnvVar from "./script/envbuild";
import checker from "vite-plugin-checker";
import { comlink } from "vite-plugin-comlink";
import vitePWA from "./script/pwa";

// Since it distracts debugging via service worker, enable it only on production build
const prodOnlyPlugin = [vitePWA];
declare const process: {
    cwd: () => string;
};

export default defineConfig(async (ctx) => {
    const mode = ctx.mode;
    const env = loadEnv(mode, process.cwd(), "");
    const defines: Record<string, any> = {
        ...getEnvVar(ctx, env),
    };

    const defineConfigReady = Object.fromEntries(
        Object.entries(defines).map(([k, v]) => [
            `import.meta.env.${k}`,
            JSON.stringify(v),
        ])
    );
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
                    manualChunks: {
                        // 벤더 라이브러리들을 별도 청크로 분리
                        "vendor-core": ["svelte", "svelte/internal"],
                        "vendor-ui": ["lucide-svelte"],
                        "vendor-utils": ["jszip"],
                    },
                },
            },
        },
        clearScreen: false,
        publicDir: "static",
        plugins: [
            tsconfigPaths(),

            checker({
                /**
                 * @todo The error should be fixed, since there's so many errors now. Disabled for now since it works anyway.
                 */
                typescript: env.STRICT
                    ? { tsconfigPath: "./tsconfig.json" }
                    : false,
            }),
            checker({
                typescript: { tsconfigPath: "./tsconfig.worker.json" },
            }),
            comlink(),
            svelte({
                compilerOptions: {
                    dev: mode !== "production",
                },
            }),
            ...(mode === "production" ? prodOnlyPlugin : []),
        ],
        define: defineConfigReady,
    };
    return baseConfig;
});
