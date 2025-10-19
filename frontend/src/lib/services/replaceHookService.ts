import { get } from "svelte/store";
import { replaceHooks } from "../stores/replaceHooks";
import type {
    ReplaceHook,
    HookResult,
    ApplyHookOptions,
} from "../../types/replaceHook";

/**
 * Service for executing replace hooks on text
 * Hooks are executed in priority order (higher priority first)
 */

/**
 * Apply a single rule to text
 * Handles both literal string replacement and regex replacement
 */
function applyRule(
    text: string,
    from: string,
    to: string,
    useRegex: boolean,
    caseSensitive: boolean
): { result: string; matchCount: number } {
    try {
        if (useRegex) {
            const flags = caseSensitive ? "g" : "gi";
            const regex = new RegExp(from, flags);
            const matches = text.match(regex);
            const matchCount = matches ? matches.length : 0;
            return {
                result: text.replace(regex, to),
                matchCount,
            };
        } else {
            // Literal string replacement
            let result = text;
            let matchCount = 0;

            if (caseSensitive) {
                let index = 0;
                while ((index = result.indexOf(from, index)) !== -1) {
                    result =
                        result.substring(0, index) +
                        to +
                        result.substring(index + from.length);
                    index += to.length;
                    matchCount++;
                }
            } else {
                const lowerText = text.toLowerCase();
                const lowerFrom = from.toLowerCase();
                let index = 0;

                while ((index = lowerText.indexOf(lowerFrom, index)) !== -1) {
                    result =
                        result.substring(0, index) +
                        to +
                        result.substring(index + from.length);
                    index += to.length;
                    matchCount++;
                }
            }

            return { result, matchCount };
        }
    } catch (error) {
        console.error("Error applying rule:", error);
        return { result: text, matchCount: 0 };
    }
}

/**
 * Apply a single hook's rules to text
 * Rules are executed in order
 */
function applyHook(
    text: string,
    hook: ReplaceHook,
    maxIterations: number = 10
): {
    result: string;
    appliedRules: Array<{
        ruleId: string;
        ruleName: string;
        from: string;
        to: string;
        matchCount: number;
    }>;
} {
    if (!hook.enabled) {
        return { result: text, appliedRules: [] };
    }

    let result = text;
    const appliedRules: Array<{
        ruleId: string;
        ruleName: string;
        from: string;
        to: string;
        matchCount: number;
    }> = [];

    for (const rule of hook.rules) {
        if (!rule.enabled) continue;

        // Apply rule up to maxIterations times to avoid infinite loops
        let iterationCount = 0;
        let previousResult = result;

        while (iterationCount < maxIterations) {
            const { result: newResult, matchCount } = applyRule(
                result,
                rule.from,
                rule.to,
                rule.useRegex,
                rule.caseSensitive
            );

            if (newResult === previousResult) {
                // No changes, rule has been fully applied
                if (matchCount > 0 || iterationCount === 0) {
                    appliedRules.push({
                        ruleId: rule.id,
                        ruleName: rule.name,
                        from: rule.from,
                        to: rule.to,
                        matchCount:
                            matchCount ||
                            (previousResult !== newResult ? 1 : 0),
                    });
                }
                break;
            }

            result = newResult;
            previousResult = newResult;
            iterationCount++;
        }
    }

    return { result, appliedRules };
}

/**
 * Apply all hooks of a specific type to text
 * Hooks are sorted by priority (higher priority first) before execution
 */
export async function applyHooksByType(
    text: string,
    type: "input" | "output" | "request" | "display",
    options: ApplyHookOptions = {}
): Promise<HookResult> {
    const config = get(replaceHooks);
    const hooksKey = `${type}Hooks` as keyof typeof config;
    const allHooks = config[hooksKey] as ReplaceHook[];

    // Sort by priority (higher first)
    const sortedHooks = [...allHooks].sort((a, b) => b.priority - a.priority);

    let result = text;
    const appliedRulesInfo: HookResult["appliedRules"] = [];
    let appliedHookCount = 0;

    for (const hook of sortedHooks) {
        // Skip if in exclusion list
        if (options.excludeHookIds?.includes(hook.id)) continue;

        const { result: newResult, appliedRules } = applyHook(
            result,
            hook,
            options.maxIterations || 10
        );

        if (appliedRules.length > 0) {
            appliedHookCount++;
            result = newResult;

            appliedRulesInfo.push(
                ...appliedRules.map((rule) => ({
                    hookId: hook.id,
                    ruleId: rule.ruleId,
                    ruleName: rule.ruleName,
                    from: rule.from,
                    to: rule.to,
                    matchCount: rule.matchCount,
                }))
            );
        }
    }

    return {
        original: text,
        modified: result,
        appliedRules: appliedRulesInfo,
        appliedHookCount,
    };
}

/**
 * Apply input hooks to user message
 */
export async function applyInputHooks(
    text: string,
    options?: ApplyHookOptions
): Promise<HookResult> {
    return applyHooksByType(text, "input", options);
}

/**
 * Apply output hooks to AI response
 */
export async function applyOutputHooks(
    text: string,
    options?: ApplyHookOptions
): Promise<HookResult> {
    return applyHooksByType(text, "output", options);
}

/**
 * Apply request hooks to API request
 */
export async function applyRequestHooks(
    text: string,
    options?: ApplyHookOptions
): Promise<HookResult> {
    return applyHooksByType(text, "request", options);
}

/**
 * Apply display hooks to displayed message
 */
export async function applyDisplayHooks(
    text: string,
    options?: ApplyHookOptions
): Promise<HookResult> {
    return applyHooksByType(text, "display", options);
}

/**
 * Apply all applicable hooks to text
 * Useful for previewing final result after all hooks
 */
export async function applyAllHooks(
    text: string,
    options?: ApplyHookOptions
): Promise<{
    afterInput: HookResult;
    afterOutput: HookResult;
    afterRequest: HookResult;
    afterDisplay: HookResult;
}> {
    const afterInput = await applyInputHooks(text, options);
    const afterOutput = await applyOutputHooks(afterInput.modified, options);
    const afterRequest = await applyRequestHooks(afterOutput.modified, options);
    const afterDisplay = await applyDisplayHooks(
        afterRequest.modified,
        options
    );

    return {
        afterInput,
        afterOutput,
        afterRequest,
        afterDisplay,
    };
}
