import { defineConfig } from "oxlint";
import oxlintEslintWarn from "./scripts/linter/oxlint-eslint-warn.js";
import oxlintEslintError from "./scripts/linter/oxlint-eslint-error.js";
export default defineConfig({
    jsPlugins: ["eslint-plugin-zod"],
    extends: [oxlintEslintError, oxlintEslintWarn],
    ignorePatterns: [
        "**/static/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.cache/**",
        "**/.svelte-check/**",
        "**/dist-ts/**",
    ],
    overrides: [
        {
            files: ["**/*.svelte"],
            jsPlugins: ["eslint-plugin-phosphor-svelte"],
            rules: {
                "phosphor-svelte/optimize-imports": "warn",
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
        // SDK/worker boundary files where type assertions bridge
        // structurally identical but nominally incompatible types.
        {
            files: [
                "src/lib/providers/chat/GeminiChatProvider.ts",
                "src/lib/migration/storageMigration.ts",
                "worker/cardparse/parse.ts",
                "src/features/character/adapters/storage/LocalStorageAdapter.ts",
                "src/lib/adapters/storage/persona/IDBPersonaAdapter.ts",
                "src/lib/adapters/storage/chat/IDBChatAdapter.ts",
            ],
            rules: {
                "@typescript-eslint/consistent-type-assertions": "off",
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
