import { persistentStore } from "./persistentStore";
import type {
    ReplaceHook,
    ReplaceHooksConfig,
    ReplaceHookType,
    ReplaceRule,
} from "../../types/replaceHook";

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initial empty configuration for replace hooks
 */
const initialConfig: ReplaceHooksConfig = {
    inputHooks: [],
    outputHooks: [],
    requestHooks: [],
    displayHooks: [],
};

/**
 * Persistent store for all replace hooks
 */
export const replaceHooks = persistentStore<ReplaceHooksConfig>(
    "personaChat_replaceHooks_v1",
    initialConfig
);

if (import.meta.env.DEV) {
    replaceHooks.subscribe((i) => {
        Object.keys(i).forEach((key) => {
            if (!(key in initialConfig)) {
                console.error(`Unexpected key in replaceHooks store: ${key}`);
            }
        });
    });
}

/**
 * Add a new hook to the store
 */
export function addHook(
    hook: Omit<ReplaceHook, "id" | "createdAt" | "updatedAt">
): ReplaceHook {
    const newHook: ReplaceHook = {
        ...hook,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    replaceHooks.update((config) => {
        const hooks = config[`${hook.type}Hooks`];
        return {
            ...config,
            [`${hook.type}Hooks`]: [...hooks, newHook],
        };
    });

    return newHook;
}

/**
 * Update an existing hook
 */
export function updateHook(
    type: ReplaceHookType,
    hookId: string,
    updates: Partial<ReplaceHook>
): void {
    replaceHooks.update((config) => {
        const hooks = config[`${type}Hooks` satisfies keyof ReplaceHooksConfig];
        return {
            ...config,
            [`${type}Hooks` satisfies keyof ReplaceHooksConfig]: hooks.map(
                (h) =>
                    h.id === hookId
                        ? ({
                              ...h,
                              ...updates,
                              updatedAt: Date.now(),
                          } satisfies ReplaceHook)
                        : h
            ),
        };
    });
}

/**
 * Delete a hook
 */
export function deleteHook(
    type: "input" | "output" | "request" | "display",
    hookId: string
): void {
    replaceHooks.update((config) => {
        const hooks = config[`${type}Hooks`];
        return {
            ...config,
            [`${type}Hooks`]: hooks.filter((h) => h.id !== hookId),
        };
    });
}

/**
 * Add a rule to a hook
 */
export function addRuleToHook(
    type: "input" | "output" | "request" | "display",
    hookId: string,
    rule: Omit<ReplaceRule, "id">
): void {
    replaceHooks.update((config) => {
        const hooks = config[`${type}Hooks`];
        return {
            ...config,
            [`${type}Hooks`]: hooks.map((h) =>
                h.id === hookId
                    ? {
                          ...h,
                          rules: [
                              ...h.rules,
                              {
                                  ...rule,
                                  id: generateId(),
                              },
                          ],
                          updatedAt: Date.now(),
                      }
                    : h
            ),
        };
    });
}

/**
 * Update a rule in a hook
 */
export function updateRuleInHook(
    type: "input" | "output" | "request" | "display",
    hookId: string,
    ruleId: string,
    updates: Partial<ReplaceRule>
): void {
    replaceHooks.update((config) => {
        const hooks = config[`${type}Hooks`];
        return {
            ...config,
            [`${type}Hooks`]: hooks.map((h) =>
                h.id === hookId
                    ? {
                          ...h,
                          rules: h.rules.map((r) =>
                              r.id === ruleId ? { ...r, ...updates } : r
                          ),
                          updatedAt: Date.now(),
                      }
                    : h
            ),
        };
    });
}

/**
 * Delete a rule from a hook
 */
export function deleteRuleFromHook(
    type: "input" | "output" | "request" | "display",
    hookId: string,
    ruleId: string
): void {
    replaceHooks.update((config) => {
        const hooks = config[`${type}Hooks`];
        return {
            ...config,
            [`${type}Hooks`]: hooks.map((h) =>
                h.id === hookId
                    ? {
                          ...h,
                          rules: h.rules.filter((r) => r.id !== ruleId),
                          updatedAt: Date.now(),
                      }
                    : h
            ),
        };
    });
}

/**
 * Clear all hooks of a specific type
 */
export function clearHooksOfType(
    type: "input" | "output" | "request" | "display"
): void {
    replaceHooks.update((config) => ({
        ...config,
        [`${type}Hooks`]: [],
    }));
}

/**
 * Reset all hooks
 */
export function resetAllHooks(): void {
    replaceHooks.set(initialConfig);
}

/**
 * Export hooks configuration (for backup)
 */
export function exportHooksConfig(config: ReplaceHooksConfig): string {
    return JSON.stringify(config, null, 2);
}

/**
 * Import hooks configuration (for restore)
 */
export function importHooksConfig(jsonString: string): ReplaceHooksConfig {
    try {
        const config = JSON.parse(jsonString) as ReplaceHooksConfig;
        // Validate structure
        if (
            !config.inputHooks ||
            !config.outputHooks ||
            !config.requestHooks ||
            !config.displayHooks
        ) {
            throw new Error("Invalid hooks configuration structure");
        }
        replaceHooks.set(config);
        return config;
    } catch (error) {
        throw new Error(
            `Failed to import hooks config: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Move a hook up in order (lower index = higher priority = executes first)
 */
export function moveHookUp(
    type: keyof ReplaceHooksConfig,
    hookId: string
): void {
    replaceHooks.update((config) => {
        const key = type;
        const hooks = config[key] as ReplaceHook[];
        const index = hooks.findIndex((h) => h.id === hookId);

        if (index <= 0) return config; // Can't move up

        const newHooks = [...hooks];
        [newHooks[index - 1], newHooks[index]] = [
            newHooks[index],
            newHooks[index - 1],
        ];

        return {
            ...config,
            [key]: newHooks,
        };
    });
}

/**
 * Move a hook down in order (higher index = lower priority = executes later)
 */
export function moveHookDown(type: ReplaceHookType, hookId: string): void {
    replaceHooks.update((config) => {
        const key = `${type}Hooks` satisfies keyof ReplaceHooksConfig;
        const hooks = config[key] satisfies ReplaceHook[];
        const index = hooks.findIndex((h) => h.id === hookId);

        if (index >= hooks.length - 1) return config; // Can't move down

        const newHooks = [...hooks];
        [newHooks[index], newHooks[index + 1]] = [
            newHooks[index + 1],
            newHooks[index],
        ];

        return {
            ...config,
            [key]: newHooks,
        };
    });
}

/**
 * Reorder hooks using array of hook IDs
 */
export function reorderHooks(
    type: "input" | "output" | "request" | "display",
    orderedIds: string[]
): void {
    replaceHooks.update((config) => {
        const key = `${type}Hooks` satisfies keyof ReplaceHooksConfig;
        const hooks = config[key] as ReplaceHook[];

        const hookMap = new Map(hooks.map((h) => [h.id, h]));
        const reorderedHooks = orderedIds
            .map((id) => hookMap.get(id))
            .filter((h): h is ReplaceHook => h !== undefined);

        return {
            ...config,
            [key]: reorderedHooks,
        };
    });
}

/**
 * Move a rule up within a hook
 */
export function moveRuleUp(
    type: ReplaceHookType,
    hookId: string,
    ruleId: string
): void {
    replaceHooks.update((config) => {
        const key = `${type}Hooks` satisfies keyof ReplaceHooksConfig;
        const hooks = config[key] satisfies ReplaceHook[];
        const hookIndex = hooks.findIndex((h) => h.id === hookId);

        if (hookIndex === -1) return config;

        const hook = hooks[hookIndex];
        const ruleIndex = hook.rules.findIndex((r) => r.id === ruleId);

        if (ruleIndex <= 0) return config; // Can't move up

        const newRules = [...hook.rules];
        [newRules[ruleIndex - 1], newRules[ruleIndex]] = [
            newRules[ruleIndex],
            newRules[ruleIndex - 1],
        ];

        const newHooks = [...hooks];
        newHooks[hookIndex] = {
            ...hook,
            rules: newRules,
            updatedAt: Date.now(),
        };

        return {
            ...config,
            [key]: newHooks,
        };
    });
}

/**
 * Move a rule down within a hook
 */
export function moveRuleDown(
    type: ReplaceHookType,
    hookId: string,
    ruleId: string
): void {
    replaceHooks.update((config) => {
        const key = `${type}Hooks` satisfies keyof ReplaceHooksConfig;
        const hooks = config[key] as ReplaceHook[];
        const hookIndex = hooks.findIndex((h) => h.id === hookId);

        if (hookIndex === -1) return config;

        const hook = hooks[hookIndex];
        const ruleIndex = hook.rules.findIndex((r) => r.id === ruleId);

        if (ruleIndex >= hook.rules.length - 1) return config; // Can't move down

        const newRules = [...hook.rules];
        [newRules[ruleIndex], newRules[ruleIndex + 1]] = [
            newRules[ruleIndex + 1],
            newRules[ruleIndex],
        ];

        const newHooks = [...hooks];
        newHooks[hookIndex] = {
            ...hook,
            rules: newRules,
            updatedAt: Date.now(),
        };

        return {
            ...config,
            [key]: newHooks,
        };
    });
}

/**
 * Reorder rules within a hook
 */
export function reorderRules(
    type: ReplaceHookType,
    hookId: string,
    orderedRuleIds: string[]
): void {
    replaceHooks.update((config) => {
        const key = `${type}Hooks` satisfies keyof ReplaceHooksConfig;
        const hooks = config[key] satisfies ReplaceHook[];
        const hookIndex = hooks.findIndex((h) => h.id === hookId);

        if (hookIndex === -1) return config;

        const hook = hooks[hookIndex];
        const ruleMap = new Map(hook.rules.map((r) => [r.id, r]));
        const reorderedRules = orderedRuleIds
            .map((id) => ruleMap.get(id))
            .filter((r): r is ReplaceRule => r !== undefined);

        const newHooks = [...hooks];
        newHooks[hookIndex] = {
            ...hook,
            rules: reorderedRules,
            updatedAt: Date.now(),
        };

        return {
            ...config,
            [key]: newHooks,
        };
    });
}
