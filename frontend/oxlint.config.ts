import { defineConfig } from "oxlint";
import oxlintEslintWarn from "./scripts/linter/oxlint-eslint-warn.js";
import oxlintEslintError from "./scripts/linter/oxlint-eslint-error.js";
export default defineConfig({
    extends: [oxlintEslintError, oxlintEslintWarn],
    ignorePatterns: [
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/.cache/**",
        "**/.svelte-check/**",
        "**/dist-ts/**",
        "**/*.svelte",
        "**/*.svelte.ts",
    ],
    overrides: [
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
