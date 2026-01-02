export interface RegexRule {
    /**
     * The regex pattern string.
     */
    pattern: string;

    /**
     * The replacement string.
     */
    replacement: string;

    /**
     * Regex flags (e.g., "g", "i", "m").
     * @default "g"
     */
    flags?: string;
}

export interface RegexWorkerApi {
    /**
     * Applies a set of regex rules to a text string.
     * @param text The input text.
     * @param rules The rules to apply.
     */
    applyRules(text: string, rules: RegexRule[]): Promise<string>;

    /**
     * Performs a single regex replacement.
     * @param text The input text.
     * @param pattern The pattern.
     * @param replacement The replacement.
     * @param flags The flags.
     */
    replace(text: string, pattern: string, replacement: string, flags?: string): Promise<string>;
}
