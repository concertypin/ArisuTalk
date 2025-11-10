import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import {
    replaceHooks,
    addHook,
    updateHook,
    deleteHook,
    addRuleToHook,
    updateRuleInHook,
    deleteRuleFromHook,
    moveHookUp,
    moveHookDown,
    reorderHooks,
    moveRuleUp,
    moveRuleDown,
    reorderRules,
    clearHooksOfType,
    resetAllHooks,
    exportHooksConfig,
    importHooksConfig,
    generateId,
} from "../../../src/lib/stores/replaceHooks";
import type { ReplaceHook, ReplaceRule } from "../../../src/types/replaceHook";

describe("replaceHooks store", () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        replaceHooks.set({
            inputHooks: [],
            outputHooks: [],
            requestHooks: [],
            displayHooks: [],
        });
        vi.clearAllMocks();
    });

    describe("generateId", () => {
        it("should generate unique IDs", () => {
            const id1 = generateId();
            const id2 = generateId();

            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe("string");
            expect(id1.length).toBeGreaterThan(0);
        });

        it("should generate IDs with timestamp and random parts", () => {
            const id = generateId();
            const parts = id.split("_");

            expect(parts).toHaveLength(2);
            expect(/^\d+$/.test(parts[0])).toBe(true); // Timestamp part
            expect(parts[1].length).toBeGreaterThan(0); // Random part
        });
    });

    describe("addHook", () => {
        it("should add a new hook with generated ID and timestamps", () => {
            const hookData = {
                name: "Test Hook",
                type: "input" as const,
                enabled: true,
                rules: [],
                priority: 10,
                description: "Test description",
            };

            const newHook = addHook(hookData);

            expect(newHook.id).toBeDefined();
            expect(newHook.createdAt).toBeDefined();
            expect(newHook.updatedAt).toBeDefined();
            expect(newHook.name).toBe(hookData.name);
            expect(newHook.type).toBe(hookData.type);

            const store = get(replaceHooks);
            expect(store.inputHooks).toHaveLength(1);
            expect(store.inputHooks[0]).toBe(newHook);
        });

        it("should add hook to correct type array", () => {
            const outputHook = {
                name: "Output Hook",
                type: "output" as const,
                enabled: true,
                rules: [],
                priority: 5,
            };

            addHook(outputHook);

            const store = get(replaceHooks);
            expect(store.outputHooks).toHaveLength(1);
            expect(store.inputHooks).toHaveLength(0);
            expect(store.requestHooks).toHaveLength(0);
            expect(store.displayHooks).toHaveLength(0);
        });
    });

    describe("updateHook", async () => {
        it("should update an existing hook", async () => {
            vi.spyOn(Date, "now").mockReturnValue(1000);
            const hook = addHook({
                name: "Original Name",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });
            vi.spyOn(Date, "now").mockReturnValue(2000);
            updateHook("input", hook.id, {
                name: "Updated Name",
                priority: 20,
            });
            vi.spyOn(Date, "now").mockRestore();
            const store = get(replaceHooks);
            const updatedHook = store.inputHooks[0];

            expect(updatedHook.name).toBe("Updated Name");
            expect(updatedHook.priority).toBe(20);
            expect(updatedHook.updatedAt).toBe(2000);
            expect(hook.createdAt).toBe(1000);
        });

        it("should not update hook if type is wrong", () => {
            const hook = addHook({
                name: "Test Hook",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });

            updateHook("output", hook.id, { name: "Should not update" });

            const store = get(replaceHooks);
            expect(store.inputHooks[0].name).toBe("Test Hook");
        });
    });

    describe("deleteHook", () => {
        it("should delete a hook", () => {
            const hook = addHook({
                name: "Test Hook",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });

            deleteHook("input", hook.id);

            const store = get(replaceHooks);
            expect(store.inputHooks).toHaveLength(0);
        });

        it("should not affect other hook types when deleting", () => {
            const inputHook = addHook({
                name: "Input Hook",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });

            const outputHook = addHook({
                name: "Output Hook",
                type: "output",
                enabled: true,
                rules: [],
                priority: 10,
            });

            deleteHook("input", inputHook.id);

            const store = get(replaceHooks);
            expect(store.inputHooks).toHaveLength(0);
            expect(store.outputHooks).toHaveLength(1);
        });
    });

    describe("rule management", () => {
        /**
         * Mock Date.now for consistent timestamps
         * updateAt and createdAt is 1000 by default
         */
        let testHook: ReplaceHook;

        beforeEach(() => {
            vi.spyOn(Date, "now").mockReturnValue(1000);
            testHook = addHook({
                name: "Test Hook",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });
            vi.spyOn(Date, "now").mockRestore();
        });

        describe("addRuleToHook", () => {
            it("should add a rule to a hook", () => {
                const ruleData = {
                    name: "Test Rule",
                    enabled: true,
                    from: "hello",
                    to: "hi",
                    useRegex: false,
                    caseSensitive: false,
                };

                addRuleToHook("input", testHook.id, ruleData);
                const store = get(replaceHooks);
                const hook = store.inputHooks[0];

                expect(hook.rules).toHaveLength(1);
                expect(hook.rules[0].id).toBeDefined();
                expect(hook.rules[0].name).toBe(ruleData.name);
                expect(hook.updatedAt).toBeGreaterThan(testHook.updatedAt);
            });
        });

        describe("updateRuleInHook", () => {
            it("should update a rule in a hook", () => {
                const rule = {
                    name: "Test Rule",
                    enabled: true,
                    from: "hello",
                    to: "hi",
                    useRegex: false,
                    caseSensitive: false,
                };

                addRuleToHook("input", testHook.id, rule);

                const store = get(replaceHooks);
                const ruleId = store.inputHooks[0].rules[0].id;

                updateRuleInHook("input", testHook.id, ruleId, {
                    name: "Updated Rule",
                    from: "goodbye",
                });

                const updatedStore = get(replaceHooks);
                const updatedRule = updatedStore.inputHooks[0].rules[0];

                expect(updatedRule.name).toBe("Updated Rule");
                expect(updatedRule.from).toBe("goodbye");
                expect(updatedRule.to).toBe("hi"); // Should remain unchanged
            });
        });

        describe("deleteRuleFromHook", () => {
            it("should delete a rule from a hook", () => {
                const rule = {
                    name: "Test Rule",
                    enabled: true,
                    from: "hello",
                    to: "hi",
                    useRegex: false,
                    caseSensitive: false,
                };

                addRuleToHook("input", testHook.id, rule);

                const store = get(replaceHooks);
                const ruleId = store.inputHooks[0].rules[0].id;

                deleteRuleFromHook("input", testHook.id, ruleId);

                const updatedStore = get(replaceHooks);
                expect(updatedStore.inputHooks[0].rules).toHaveLength(0);
            });
        });
    });

    describe("hook ordering", () => {
        let hook1: ReplaceHook;
        let hook2: ReplaceHook;
        let hook3: ReplaceHook;

        beforeEach(() => {
            hook1 = addHook({
                name: "Hook 1",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });

            hook2 = addHook({
                name: "Hook 2",
                type: "input",
                enabled: true,
                rules: [],
                priority: 20,
            });

            hook3 = addHook({
                name: "Hook 3",
                type: "input",
                enabled: true,
                rules: [],
                priority: 30,
            });
        });

        describe("moveHookUp", () => {
            it("should move a hook up in array order", () => {
                moveHookUp("inputHooks", hook3.id);

                const store = get(replaceHooks);
                expect(store.inputHooks[0].id).toBe(hook1.id);
                expect(store.inputHooks[1].id).toBe(hook3.id);
                expect(store.inputHooks[2].id).toBe(hook2.id);
            });

            it("should not move first hook up", () => {
                const originalOrder = [...get(replaceHooks).inputHooks];
                moveHookUp("inputHooks", hook1.id);

                const store = get(replaceHooks);
                expect(store.inputHooks).toEqual(originalOrder);
            });
        });

        describe("moveHookDown", () => {
            it("should move a hook down in priority order", () => {
                moveHookDown("input", hook1.id);

                const store = get(replaceHooks);
                expect(store.inputHooks[0].id).toBe(hook2.id);
                expect(store.inputHooks[1].id).toBe(hook1.id);
                expect(store.inputHooks[2].id).toBe(hook3.id);
            });

            it("should not move last hook down", () => {
                const originalOrder = [...get(replaceHooks).inputHooks];
                moveHookDown("input", hook3.id);

                const store = get(replaceHooks);
                expect(store.inputHooks).toEqual(originalOrder);
            });
        });

        describe("reorderHooks", () => {
            it("should reorder hooks based on provided IDs", () => {
                reorderHooks("input", [hook2.id, hook3.id, hook1.id]);

                const store = get(replaceHooks);
                expect(store.inputHooks[0].id).toBe(hook2.id);
                expect(store.inputHooks[1].id).toBe(hook3.id);
                expect(store.inputHooks[2].id).toBe(hook1.id);
            });

            it("should handle missing IDs gracefully", () => {
                reorderHooks("input", [hook2.id, hook1.id]);

                const store = get(replaceHooks);
                expect(store.inputHooks).toHaveLength(2);
                expect(store.inputHooks[0].id).toBe(hook2.id);
                expect(store.inputHooks[1].id).toBe(hook1.id);
            });
        });
    });

    describe("rule ordering", () => {
        let testHook: ReplaceHook;
        let rule1: ReplaceRule;
        let rule2: ReplaceRule;
        let rule3: ReplaceRule;

        beforeEach(() => {
            testHook = addHook({
                name: "Test Hook",
                type: "input",
                enabled: true,
                rules: [],
                priority: 10,
            });

            rule1 = {
                id: generateId(),
                name: "Rule 1",
                enabled: true,
                from: "a",
                to: "b",
                useRegex: false,
                caseSensitive: false,
            };

            rule2 = {
                id: generateId(),
                name: "Rule 2",
                enabled: true,
                from: "c",
                to: "d",
                useRegex: false,
                caseSensitive: false,
            };

            rule3 = {
                id: generateId(),
                name: "Rule 3",
                enabled: true,
                from: "e",
                to: "f",
                useRegex: false,
                caseSensitive: false,
            };

            addRuleToHook("input", testHook.id, rule1);
            addRuleToHook("input", testHook.id, rule2);
            addRuleToHook("input", testHook.id, rule3);

            // Get the actual rule IDs from the store
            const store = get(replaceHooks);
            const actualRules = store.inputHooks[0].rules;
            rule1.id = actualRules[0].id;
            rule2.id = actualRules[1].id;
            rule3.id = actualRules[2].id;
        });

        describe("moveRuleUp", () => {
            it("should move a rule up within a hook", () => {
                moveRuleUp("input", testHook.id, rule3.id);

                const store = get(replaceHooks);
                const rules = store.inputHooks[0].rules;
                expect(rules[0].id).toBe(rule1.id);
                expect(rules[1].id).toBe(rule3.id);
                expect(rules[2].id).toBe(rule2.id);
            });

            it("should not move first rule up", () => {
                const originalOrder = [
                    ...get(replaceHooks).inputHooks[0].rules,
                ];
                moveRuleUp("input", testHook.id, rule1.id);

                const store = get(replaceHooks);
                expect(store.inputHooks[0].rules).toEqual(originalOrder);
            });
        });

        describe("moveRuleDown", () => {
            it("should move a rule down within a hook", () => {
                moveRuleDown("input", testHook.id, rule1.id);

                const store = get(replaceHooks);
                const rules = store.inputHooks[0].rules;
                expect(rules[0].id).toBe(rule2.id);
                expect(rules[1].id).toBe(rule1.id);
                expect(rules[2].id).toBe(rule3.id);
            });

            it("should not move last rule down", () => {
                const originalOrder = [
                    ...get(replaceHooks).inputHooks[0].rules,
                ];
                moveRuleDown("input", testHook.id, rule3.id);

                const store = get(replaceHooks);
                expect(store.inputHooks[0].rules).toEqual(originalOrder);
            });
        });

        describe("reorderRules", () => {
            it("should reorder rules within a hook", () => {
                reorderRules("input", testHook.id, [
                    rule2.id,
                    rule3.id,
                    rule1.id,
                ]);

                const store = get(replaceHooks);
                const rules = store.inputHooks[0].rules;
                expect(rules[0].id).toBe(rule2.id);
                expect(rules[1].id).toBe(rule3.id);
                expect(rules[2].id).toBe(rule1.id);
            });
        });
    });

    describe("bulk operations", () => {
        describe("clearHooksOfType", () => {
            it("should clear all hooks of a specific type", () => {
                addHook({
                    name: "Input Hook 1",
                    type: "input",
                    enabled: true,
                    rules: [],
                    priority: 10,
                });

                addHook({
                    name: "Input Hook 2",
                    type: "input",
                    enabled: true,
                    rules: [],
                    priority: 20,
                });

                addHook({
                    name: "Output Hook",
                    type: "output",
                    enabled: true,
                    rules: [],
                    priority: 10,
                });

                clearHooksOfType("input");

                const store = get(replaceHooks);
                expect(store.inputHooks).toHaveLength(0);
                expect(store.outputHooks).toHaveLength(1);
            });
        });

        describe("resetAllHooks", () => {
            it("should reset all hooks to initial state", () => {
                addHook({
                    name: "Input Hook",
                    type: "input",
                    enabled: true,
                    rules: [],
                    priority: 10,
                });

                addHook({
                    name: "Output Hook",
                    type: "output",
                    enabled: true,
                    rules: [],
                    priority: 10,
                });

                resetAllHooks();

                const store = get(replaceHooks);
                expect(store.inputHooks).toHaveLength(0);
                expect(store.outputHooks).toHaveLength(0);
                expect(store.requestHooks).toHaveLength(0);
                expect(store.displayHooks).toHaveLength(0);
            });
        });
    });

    describe("import/export", () => {
        describe("exportHooksConfig", () => {
            it("should export configuration as JSON string", () => {
                addHook({
                    name: "Test Hook",
                    type: "input",
                    enabled: true,
                    rules: [],
                    priority: 10,
                });

                const store = get(replaceHooks);
                const exported = exportHooksConfig(store);

                expect(typeof exported).toBe("string");
                const parsed = JSON.parse(exported);
                expect(parsed).toEqual(store);
            });
        });

        describe("importHooksConfig", () => {
            it("should import valid configuration", () => {
                const config = {
                    inputHooks: [
                        {
                            id: "imported-hook",
                            name: "Imported Hook",
                            type: "input" as const,
                            enabled: true,
                            rules: [],
                            priority: 10,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        },
                    ],
                    outputHooks: [],
                    requestHooks: [],
                    displayHooks: [],
                };

                importHooksConfig(JSON.stringify(config));

                const store = get(replaceHooks);
                expect(store.inputHooks).toHaveLength(1);
                expect(store.inputHooks[0].name).toBe("Imported Hook");
            });

            it("should throw error for invalid configuration", () => {
                const invalidConfig = {
                    inputHooks: [],
                    // Missing required properties
                };

                expect(() => {
                    importHooksConfig(JSON.stringify(invalidConfig));
                }).toThrow("Invalid hooks configuration structure");
            });

            it("should throw error for malformed JSON", () => {
                expect(() => {
                    importHooksConfig("invalid json");
                }).toThrow("Failed to import hooks config");
            });
        });
    });
});
