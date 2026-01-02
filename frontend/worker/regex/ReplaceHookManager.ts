import type { RegexRule } from "./types";

/**
 * Manages and applies a collection of regex-based replacement hooks.
 */
export class ReplaceHookManager {
    private rules: RegexRule[] = [];

    /**
     * Creates a new ReplaceHookManager with an optional initial set of rules.
     * @param rules Initial regex rules.
     */
    constructor(rules: RegexRule[] = []) {
        this.rules = rules;
    }

    /**
     * Adds a new rule to the manager.
     * @param rule The regex rule to add.
     */
    addRule(rule: RegexRule): void {
        this.rules.push(rule);
    }

    /**
     * Removes all rules from the manager.
     */
    clearRules(): void {
        this.rules = [];
    }

    /**
     * Sets the rules for the manager.
     * @param rules The new set of rules.
     */
    setRules(rules: RegexRule[]): void {
        this.rules = rules;
    }

    /**
     * Applies all managed rules sequentially to the input text.
     * @param text The input text to transform.
     * @returns The transformed text.
     */
    apply(text: string): string {
        let result = text;
        for (const rule of this.rules) {
            try {
                const re = new RegExp(rule.pattern, rule.flags || "g");
                result = result.replace(re, rule.replacement);
            } catch (e) {
                console.error(`Failed to apply regex rule: ${rule.pattern}`, e);
            }
        }
        return result;
    }
}
