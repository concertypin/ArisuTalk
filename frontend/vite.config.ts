import { defineConfig, loadEnv, UserConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import getEnvVar from "./script/envbuild";
import tsconfigPath from "vite-tsconfig-paths";
import path from "path";
// Since it distracts debugging via service worker, enable it only on production build
const prodOnlyPlugin = [
    VitePWA({
        registerType: "autoUpdate",
        workbox: {
            maximumFileSizeToCacheInBytes: 12 * 1024 * 1024, // Allow precaching bundles up to 12MB
            sourcemap: false,
        },
        manifest: {
            name: "ArisuTalk",
            short_name: "ArisuTalk",
            description: "ArisuTalk, chat with your waifu.",
            icons: [
                {
                    src: "icon_192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    src: "icon_512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
            ],
        },
    }),
];

declare const process: {
    cwd: () => string;
};

const predefinedChunks: Record<string, string[]> = {
    // 벤더 라이브러리들을 별도 청크로 분리
    "vendor-core": ["svelte", "svelte/internal"],
    "vendor-ui": ["lucide-svelte"],
    "vendor-utils": ["jszip"],
    "langchain-core": ["@langchain/core"],
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
        build: {
            outDir: "dist",
            sourcemap: "inline",
            rollupOptions: {
                output: {
                    manualChunks: predefinedChunks,
                },
            },
        },
        clearScreen: false,
        publicDir: "static",
        plugins: [
            tsconfigPath(),
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
