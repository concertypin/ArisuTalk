import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Since it distracts debugging via service worker, enable it only on production build
const prodOnlyPlugin = [
    VitePWA({
        registerType: "autoUpdate",
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