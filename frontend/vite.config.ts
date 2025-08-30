import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    server: {
        allowedHosts: process.env.ALLOWED_HOSTS?.split(","),
        // in a Docker environment, browser will not open.
        open: process.env.IS_DOCKER ? false : "index.html",
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
