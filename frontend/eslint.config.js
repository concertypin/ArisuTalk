import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { defineConfig } from "eslint/config";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const tsConfig = !process.env.SKIP_TYPE_LINT
    ? ts.configs.recommendedTypeChecked
    : ts.configs.recommended;

const isCI = process.env.CI ? true : false;
export default defineConfig([
    {
        ignores: ["dist/", "node_modules/", "*.config.*"],
    },
    js.configs.recommended,
    ...tsConfig,
    ...svelte.configs["flat/recommended"],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
                extraFileExtensions: [".svelte"],
            },
        },
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
            },
        },
    },
    {
        rules: {
            // Allow unused vars prefixed with _
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            // Allow empty interfaces for placeholders
            "@typescript-eslint/no-empty-object-type": "off",
            // Disable require-await - adapter pattern uses async for interface compatibility
            "@typescript-eslint/require-await": "off",
            // Disable unbound-method - false positives with Svelte stores
            "@typescript-eslint/unbound-method": "off",
            "no-debugger": isCI ? "error" : "warn",
            // Use dedicated logger. Console is unrecommended since it's not pretty
            "no-console": "warn",
        },
    },
]);
