import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [cloudflare()],
    server: {
        cors: false, // https://hono.dev/docs/middleware/builtin/cors#using-with-vite
    },
    build: {
        sourcemap: true,
        lib: {
            entry: "src/main.ts",
            formats: ["es"],
        },
    },
    clearScreen: false,
});
