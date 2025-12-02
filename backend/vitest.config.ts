import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { defineConfig, mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import viteConfig from "./vite.config.js";
export default mergeConfig(
    defineConfig({
        ...viteConfig,
        plugins: [tsconfigPaths()],
    }),
    defineWorkersConfig({
        test: {
            poolOptions: {
                workers: {
                    wrangler: { configPath: "./wrangler.jsonc" },
                },
            },
        },
    }),
);
