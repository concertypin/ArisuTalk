/**
 * Replace Hook Types
 * Defines the structure for text replacement hooks that can be applied at different stages
 */

/**
 * A single replace rule that maps input patterns to replacement strings
 */
export interface ReplaceRule {
    id: string; // Unique identifier for the rule
    name: string; // Display name for the rule
    enabled: boolean; // Whether this rule is active
    from: string; // Pattern to search for (can be literal string or regex)
    to: string; // Replacement string
    useRegex: boolean; // Whether 'from' should be treated as regex
    caseSensitive: boolean; // Whether the replacement is case-sensitive
}

/**
 * A collection of rules that can be applied together
 */
export interface ReplaceHook {
    id: string; // Unique identifier
    name: string; // Display name
    type: "input" | "output" | "request" | "display"; // When this hook applies
    description?: string; // Optional description
    enabled: boolean; // Whether this hook is active
    rules: ReplaceRule[]; // Array of replacement rules
    priority: number; // Execution order (higher = executed first)
    createdAt: number; // Timestamp
    updatedAt: number; // Timestamp
}

/**
 * Configuration for all replace hooks
 */
export interface ReplaceHooksConfig {
    inputHooks: ReplaceHook[]; // Applied to user input before storage
    outputHooks: ReplaceHook[]; // Applied to AI response before storage
    requestHooks: ReplaceHook[]; // Applied to data sent to API (not displayed)
    displayHooks: ReplaceHook[]; // Applied only for display (every update)
}

/**
 * Options for applying hooks
 */
export interface ApplyHookOptions {
    excludeHookIds?: string[]; // Specific hooks to skip
    maxIterations?: number; // Max times to apply same rule to avoid infinite loops
}

/**
 * Result of applying a hook to text
 */
export interface HookResult {
    original: string;
    modified: string;
    appliedRules: Array<{
        hookId: string;
        ruleId: string;
        ruleName: string;
        from: string;
        to: string;
        matchCount: number;
    }>;
    appliedHookCount: number;
}
