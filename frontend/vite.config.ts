import { defineConfig, UserConfig } from "vite";
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


const baseConfigFactory = defineConfig(
    ({ mode }) => {
        return {
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
        }
    }
)

export default defineConfig(async (env) => {
    // If there is a object in both configs, merge them
    // If there is object in object, merge them recursively
    // If there is array in both configs, concatenate them
    // If there is primitive in both configs, localConfig takes precedence
    const localConfig: Partial<UserConfig> =
        //@ts-ignore
        await import(`./vite.config.local.ts`)
            .then(mod => mod.default(env)).catch(() => ({}))
    let mergedConfig = baseConfigFactory(env)
    mergedConfig = {
        ...mergedConfig,
        ...localConfig,
        server: {
            ...mergedConfig.server,
            ...(localConfig.server || {}),
            proxy: {
                ...mergedConfig.server?.proxy,
                ...localConfig.server?.proxy,
            }
        },
        plugins: [
            ...(mergedConfig.plugins || []),
            ...(localConfig.plugins || [])
        ],
    }
    return mergedConfig
});
