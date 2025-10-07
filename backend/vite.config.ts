import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [cloudflare(), tsconfigPaths()],
    server: {
        cors: false, // https://hono.dev/docs/middleware/builtin/cors#using-with-vite
    },
    build: {
        sourcemap: true,
        lib: {
            entry: "src/main.ts",
            formats: ["es"],
        },
        outDir: "dist",
    },
    preview: { port: 5179 },
    clearScreen: false,
});
