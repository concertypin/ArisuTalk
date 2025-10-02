import { defineConfig, loadEnv, UserConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";
import getEnvVar from "./script/envbuild";

// Since it distracts debugging via service worker, enable it only on production build
const prodOnlyPlugin = [
    VitePWA({
        registerType: "autoUpdate",
        workbox: {
            maximumFileSizeToCacheInBytes: 4000000, // 4MB로 증가 (기본값: 2MB)
        },
        manifest: {
            name: "ArisuTalk",
            short_name: "ArisuTalk",
            description: "ArisuTalk, chat with your waifu.",
            icons: [
                {
                    src: "icon_192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "icon_512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ]
        }
    })
]
export default defineConfig(async ({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const defines: Record<string, any> = {
        ...getEnvVar(env)
    }

    const defineConfigReady = Object.fromEntries(Object.entries(defines).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)]))
    let baseConfig: UserConfig = {
        // import.meta.env.DEV is automatically set by Vite based on the 'mode'.
        // It is true in development (pnpm dev:fe) and false in production (pnpm build:fe).
        server: {
            open: "index.html",
        },
        build: {
            outDir: "dist",
            sourcemap: "inline",
            rollupOptions: {
                output: {
                    manualChunks: {
                        // 벤더 라이브러리들을 별도 청크로 분리
                        'vendor-core': ['svelte', 'svelte/internal'],
                        'vendor-ui': ['lucide-svelte'],
                        'vendor-utils': ['jszip'],
                    }
                }
            }
        },
        clearScreen: false,
        publicDir: "static",
        plugins: [
            svelte(),
            ...(mode === 'production' ? prodOnlyPlugin : [])
        ],
        define: defineConfigReady
    };
    return baseConfig;
}
);