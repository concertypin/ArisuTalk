import { defineConfig } from "oxlint";
export default defineConfig({
    overrides: [
        {
            files: ["**/*.svelte"],
            jsPlugins: ["eslint-plugin-phosphor-svelte"],
            rules: {
                "phosphor-svelte/optimize-imports": "warn",
                // Reactivity-related false positives.
                "prefer-const": "off",
                "no-unassigned-vars": "off",
            },
        },
    ],
});
