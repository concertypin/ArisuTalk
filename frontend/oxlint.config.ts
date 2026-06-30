import { defineConfig } from "oxlint";
import oxlintEslintWarn from "./scripts/linter/oxlint-eslint-warn.js";
import oxlintEslintError from "./scripts/linter/oxlint-eslint-error.js";
export default defineConfig({
    jsPlugins: ["eslint-plugin-zod"],
    extends: [oxlintEslintError, oxlintEslintWarn],
    ignorePatterns: [
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.cache/**",
        "**/.svelte-check/**",
        "**/dist-ts/**",
    ],
    // oxlint does not support ESLint-style rule options (e.g. assertionStyle).
    // The @typescript-eslint/consistent-type-assertions rule below will use oxlint defaults.
    // For strict "never" assertion style enforcement, use ESLint on Svelte files.
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
        {
            files: ["**/*.d.ts"],
            rules: {
                "no-unused-vars": "off",
            },
        },
        {
            files: ["**/test/**", "**/*.test.ts", "**/*.spec.ts"],
            rules: {
                "jest/require-to-throw-message": "off",
                "jest/expect-expect": "off",
                "@typescript-eslint/consistent-type-assertions": "off",
                "@typescript-eslint/consistent-type-imports": "off",
            },
        },
        {
            files: ["scripts/**/*.ts"],
            rules: {
                "no-console": "off",
            },
        },
    ],
    rules: {
        "typescript/no-deprecated": "error",
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/consistent-type-assertions": [
            "error",
            {
                assertionStyle: "never",
            },
        ],
        "import/no-relative-parent-imports": "error",
    },
    options: {
        typeCheck: true,
        typeAware: true,
        reportUnusedDisableDirectives: "warn",
        denyWarnings: true,
    },
});
