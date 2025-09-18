import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

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
export default defineConfig(({ mode }) => ({
    // import.meta.env.DEV is automatically set by Vite based on the 'mode'.
    // It is true in development (pnpm dev:fe) and false in production (pnpm build:fe).
    server: {
        open: "index.html",
    },
    build: {
        outDir: "dist",
        sourcemap: "inline",
    },
    clearScreen: false,
    publicDir: "static",
    plugins: [
        ...(mode === 'production' ? prodOnlyPlugin : [])
    ]
}));