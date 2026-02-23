//@ts-check
import type { defineConfig } from "eslint/config";

import type { RuleOptions as SvelteRules } from "eslint-plugin-svelte/lib/rule-types";
import type {} from "typescript-eslint";

// oxlint-disable-next-line typescript/no-explicit-any -- intentional: type utility
type NoArray<T> = T extends any[] ? never : T;
type ESLintConfig = NoArray<Parameters<typeof defineConfig>[number]>;
type ESLintRulesKey = keyof SvelteRules | (string & {});
// oxlint-disable-next-line typescript/no-explicit-any -- intentional: type utility
type ESLintConfigObj = Extract<Parameters<typeof defineConfig>[number], { rules?: any }>;
type ActualRuleConfig = NonNullable<ESLintConfigObj["rules"]>[string];

/**
 * Use this with `satisfies` to get autocompletion for ESLint rules while maintaining type safety.
 * @example
 * const myConfig = [
 *   {
 *     rules: {
 *       "svelte/require-store-reactive-access": "off"
 *    } satisfies CustomRules,
 *   },
 * ] as const satisfies ESLintConfig[];
 */
type CustomRules = Partial<Record<ESLintRulesKey, ActualRuleConfig>>;
export const noSvelteStore = [
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
        } satisfies CustomRules,
    },
] as const satisfies ESLintConfig[];
