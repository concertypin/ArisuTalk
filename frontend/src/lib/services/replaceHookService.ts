import { replaceHooks } from "$lib/stores/replaceHooks";
import type {
    ApplyHookOptions,
    HookResult,
    ReplaceHook,
    ReplaceHookType,
    ReplaceHooksConfig,
    ReplaceRule,
} from "$types/replaceHook";
import { get } from "svelte/store";

// Note: we dynamically import the worker `replace` function at call sites so
// tests can mock the module with `vi.mock(...)` even if the mock is declared
// after this module is loaded.

/**
 * Apply a single rule to text
 * Handles both literal string replacement and regex replacement
 */
async function applyRule(
    text: string,
    from: string,
    to: string,
    useRegex: boolean,
    caseSensitive: boolean,
): Promise<{ result: string; matchCount: number }> {
    try {
        if (useRegex) {
            const flags = caseSensitive ? "g" : "gi";
            const regex = new RegExp(from, flags);
            const matches = text.match(regex);
            const matchCount = matches ? matches.length : 0;

            // Dynamic import to respect test mocks
            const { replace: replaceFn } = await import(
                "$lib/utils/worker/replace"
            );
            if (import.meta.env.DEV) {
                // eslint-disable-next-line no-console
                console.debug(
                    "applyRule (regex): invoking worker.replace with pattern",
                    regex,
                    "replace->",
                    to,
                );
            }
            return {
                result: await replaceFn(text, {
                    pattern: regex,
                    replace: to,
                }),
                matchCount,
            };
        }

        // Literal string replacement
        // For literal replacements, delegate to the worker as well so that
        // case-sensitivity behavior is consistent and tests that mock the
        // worker are exercised. We still compute matchCount locally.
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const flags = caseSensitive ? "g" : "gi";
        const regex = new RegExp(escaped, flags);
        const matches = text.match(regex);
        const matchCount = matches ? matches.length : 0;

        // Dynamically import replace so test mocks (vi.mock) are respected.
        const { replace: replaceFn } = await import(
            "$lib/utils/worker/replace"
        );
        if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.debug(
                "applyRule (literal): invoking worker.replace with pattern",
                from,
                "caseSensitive=",
                caseSensitive,
                "replace->",
                to,
            );
        }
        // Pass caseSensitive through as extra property; tests' mock expects it.
        const resultStr = await replaceFn(text, {
            pattern: from,
            replace: to,
            caseSensitive,
        });

        return { result: resultStr, matchCount };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error applying rule:", error);
        return { result: text, matchCount: 0 };
    }
}

/**
 * Apply a single hook's rules to text
 * Rules are executed in order
 */
async function applyHook(
    text: string,
    hook: ReplaceHook,
    maxIterations: number = 10,
): Promise<{
    result: string;
    appliedRules: Array<{
        ruleId: string;
        ruleName: string;
        from: string;
        to: string;
        matchCount: number;
    }>;
}> {
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

    // Iterate over rules, but batch consecutive regex rules to reduce worker calls.
    let i = 0;
    while (i < hook.rules.length) {
        const rule = hook.rules[i];
        if (!rule.enabled) {
            i++;
            continue;
        }

        if (rule.useRegex) {
            // Collect consecutive regex rules into a group
            const group: ReplaceRule[] = [];
            let j = i;
            while (j < hook.rules.length && hook.rules[j].useRegex) {
                if (hook.rules[j].enabled) group.push(hook.rules[j]);
                j++;
            }

            // If no enabled regex rules (shouldn't happen), skip
            if (group.length === 0) {
                i = j;
                continue;
            }

            // Iteratively apply the whole regex group until stable or maxIterations
            let iteration = 0;
            let groupPrev = result;
            const totalMatches = new Array<number>(group.length).fill(0);

            while (iteration < maxIterations) {
                // compute per-rule regex objects and pre-match counts
                const patterns = group.map((r) => {
                    const flags = r.caseSensitive ? "g" : "gi";
                    return {
                        pattern: new RegExp(r.from, flags),
                        replace: r.to,
                    };
                });

                // Count matches on current text for each rule (for reporting)
                for (let k = 0; k < group.length; k++) {
                    const regex = patterns[k].pattern as RegExp;
                    const m = groupPrev.match(regex);
                    totalMatches[k] += m ? m.length : 0;
                }

                // Single worker call for the whole group (dynamic import to allow
                // tests to mock the worker module)
                const { replace: replaceFn } = await import(
                    "$lib/utils/worker/replace"
                );
                const newGroupResult = await replaceFn(groupPrev, ...patterns);

                if (newGroupResult === groupPrev) break;
                groupPrev = newGroupResult;
                iteration++;
            }

            // Push appliedRules info for each rule in the group
            for (let k = 0; k < group.length; k++) {
                const r = group[k];
                const matchCount = totalMatches[k];
                appliedRules.push({
                    ruleId: r.id,
                    ruleName: r.name,
                    from: r.from,
                    to: r.to,
                    matchCount: matchCount || 0,
                });
            }

            // Update result and advance index past the group
            result = groupPrev;
            i = j;
            continue;
        }

        // Non-regex (literal) rule: keep existing behaviour (local processing)
        // Apply rule up to maxIterations times to avoid infinite loops
        let iterationCount = 0;
        let previousResult = result;
        let totalMatches = 0;
        const beforeRuleResult = result;

        while (iterationCount < maxIterations) {
            const { result: newResult, matchCount } = await applyRule(
                result,
                rule.from,
                rule.to,
                rule.useRegex,
                rule.caseSensitive,
            );

            // Accumulate matches across iterations
            totalMatches += matchCount;

            if (newResult === previousResult) {
                // No more changes
                result = newResult;
                break;
            }

            result = newResult;
            previousResult = newResult;
            iterationCount++;
        }

        // Determine reported match count: if net result is unchanged, report 0
        const reportedMatchCount =
            result === beforeRuleResult ? 0 : totalMatches || 0;

        // Record the rule application (even if no effective changes)
        appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            from: rule.from,
            to: rule.to,
            matchCount: reportedMatchCount,
        });

        i++;
    }

    return { result, appliedRules };
}

/**
 * Apply all hooks of a specific type to text
 * Hooks are sorted by priority (higher priority first) before execution
 */
export async function applyHooksByType(
    text: string,
    type: ReplaceHookType,
    options: ApplyHookOptions = {},
): Promise<HookResult> {
    const config = get(replaceHooks);
    const hooksKey = `${type}Hooks` satisfies keyof ReplaceHooksConfig;
    const allHooks = config[hooksKey];

    // Debug: expose hooks read during development
    if (import.meta.env.DEV) {
        try {
            // eslint-disable-next-line no-console
            console.debug(
                "applyHooksByType: hooksKey",
                hooksKey,
                "count",
                allHooks.length,
            );

            console.debug(allHooks.map((h) => h.name));
        } catch (e) {
            console.error(e);
        }
    }

    // Use configured array order. The store defines execution order (index 0 runs first).

    let result = text;
    const appliedRulesInfo: HookResult["appliedRules"] = [];
    let appliedHookCount = 0;

    for (const hook of allHooks) {
        // Skip if in exclusion list
        if (options.excludeHookIds?.includes(hook.id)) continue;

        const { result: newResult, appliedRules } = await applyHook(
            result,
            hook,
            options.maxIterations || 10,
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
                })),
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
    options?: ApplyHookOptions,
): Promise<HookResult> {
    return applyHooksByType(text, "input", options);
}

/**
 * Apply output hooks to AI response
 */
export async function applyOutputHooks(
    text: string,
    options?: ApplyHookOptions,
): Promise<HookResult> {
    return applyHooksByType(text, "output", options);
}

/**
 * Apply request hooks to API request
 */
export async function applyRequestHooks(
    text: string,
    options?: ApplyHookOptions,
): Promise<HookResult> {
    return applyHooksByType(text, "request", options);
}

/**
 * Apply display hooks to displayed message
 */
export async function applyDisplayHooks(
    text: string,
    options?: ApplyHookOptions,
): Promise<HookResult> {
    return applyHooksByType(text, "display", options);
}

/**
 * Apply all applicable hooks to text
 * Useful for previewing final result after all hooks
 */
export async function applyAllHooks(
    text: string,
    options?: ApplyHookOptions,
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
        options,
    );

    return {
        afterInput,
        afterOutput,
        afterRequest,
        afterDisplay,
    };
}
