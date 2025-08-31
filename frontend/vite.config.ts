import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    server: {
        open: "index.html",
    },
    build: {
        outDir: "dist",
        sourcemap: true,
    },
    publicDir: "static",
    plugins: [
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
});