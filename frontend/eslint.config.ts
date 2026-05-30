import js from "@eslint/js";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { defineConfig } from "eslint/config";
import { dirname } from "path";
import { fileURLToPath } from "url";
import phosphorSvelte from "eslint-plugin-phosphor-svelte";
import svelteConfig from "./svelte.config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isCI = process.env.CI ? true : false;

export default defineConfig([
    {
        ignores: ["dist/", "node_modules/", "*.config.*", "coverage/", ".svelte-check/"],
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        extends: [
            js.configs.recommended,
            ...ts.configs.recommendedTypeChecked,
            ...svelte.configs["flat/recommended"],
            phosphorSvelte.configs.recommended,
        ],
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
        rules: {
            "@typescript-eslint/no-deprecated": "warn",
        },
    },

    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        languageOptions: {
            parserOptions: {
                parser: ts.parser,
                svelteConfig,
            },
        },
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
        rules: {
            // Disable slow & conflicting rule.
            "svelte/require-store-reactive-access": "off",
            "no-restricted-syntax": [
                "error",
                {
                    selector: "CallExpression[callee.name=/^(writable|readable)$/]",
                    message:
                        "Direct use of 'writable' or 'readable' is discouraged in Svelte 5. You should use Runes instead.",
                },
            ],
            "svelte/block-lang": ["error", { script: "ts" }],
        },
    },
    {
        files: ["**/*.svelte", "**/*.svelte.ts"],
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
