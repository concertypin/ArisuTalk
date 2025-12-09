import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import { replaceHooks } from "$lib/stores/replaceHooks";
import {
	applyHooksByType,
	applyInputHooks,
	applyOutputHooks,
	applyRequestHooks,
	applyDisplayHooks,
	applyAllHooks,
} from "$lib/services/replaceHookService";
import type { ReplaceHook, ReplaceRule } from "$types/replaceHook";

// Mock the replace worker
vi.mock("$lib/utils/worker/replace", () => ({
	replace: vi
		.fn()
		.mockImplementation(async (input: string, ...patterns: any[]) => {
			let result = input;
			for (const pattern of patterns) {
				if (pattern.pattern instanceof RegExp) {
					result = result.replace(pattern.pattern, pattern.replace);
				} else {
					// Handle case sensitivity properly
					const flags = pattern.caseSensitive === false ? "gi" : "g";
					const regex = new RegExp(
						pattern.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
						flags,
					);
					result = result.replace(regex, pattern.replace);
				}
			}
			return result;
		}),
}));

describe("replaceHookService", () => {
	beforeEach(() => {
		// Reset the store before each test
		replaceHooks.set({
			inputHooks: [],
			outputHooks: [],
			requestHooks: [],
			displayHooks: [],
		});
		vi.clearAllMocks();
	});

	describe("applyHooksByType", () => {
		it("should apply hooks in priority order (higher priority first)", async () => {
			const testHook1: ReplaceHook = {
				id: "hook1",
				name: "Low Priority Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "rule1",
						name: "Rule 1",
						enabled: true,
						from: "hello",
						to: "hi",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 1,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const testHook2: ReplaceHook = {
				id: "hook2",
				name: "High Priority Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "rule2",
						name: "Rule 2",
						enabled: true,
						from: "hi",
						to: "hey",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			// Add hooks to store
			replaceHooks.update((config) => ({
				...config,
				inputHooks: [testHook1, testHook2],
			}));

			const result = await applyHooksByType("hello world", "input");

			expect(result.modified).toBe("hey world");
			expect(result.appliedRules).toHaveLength(2);
			expect(result.appliedHookCount).toBe(2);
		});

		it("should skip disabled hooks", async () => {
			const disabledHook: ReplaceHook = {
				id: "disabled",
				name: "Disabled Hook",
				type: "input",
				enabled: false,
				rules: [
					{
						id: "rule1",
						name: "Rule 1",
						enabled: true,
						from: "hello",
						to: "hi",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [disabledHook],
			}));

			const result = await applyHooksByType("hello world", "input");

			expect(result.modified).toBe("hello world");
			expect(result.appliedRules).toHaveLength(0);
			expect(result.appliedHookCount).toBe(0);
		});

		it("should respect excludeHookIds option", async () => {
			const testHook: ReplaceHook = {
				id: "hook1",
				name: "Test Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "rule1",
						name: "Rule 1",
						enabled: true,
						from: "hello",
						to: "hi",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [testHook],
			}));

			const result = await applyHooksByType("hello world", "input", {
				excludeHookIds: ["hook1"],
			});

			expect(result.modified).toBe("hello world");
			expect(result.appliedRules).toHaveLength(0);
		});

		it("should handle regex rules correctly", async () => {
			const regexHook: ReplaceHook = {
				id: "regex-hook",
				name: "Regex Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "regex-rule",
						name: "Regex Rule",
						enabled: true,
						from: "\\b\\w+\\b", // Match whole words
						to: "word",
						useRegex: true,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [regexHook],
			}));

			const result = await applyHooksByType("hello world test", "input");

			expect(result.modified).toBe("word word word");
			expect(result.appliedRules).toHaveLength(1);
			expect(result.appliedRules[0].matchCount).toBeGreaterThan(0);
		});

		it("should handle case-sensitive rules", async () => {
			const caseSensitiveHook: ReplaceHook = {
				id: "case-hook",
				name: "Case Sensitive Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "case-rule",
						name: "Case Rule",
						enabled: true,
						from: "Hello",
						to: "Hi",
						useRegex: false,
						caseSensitive: true,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [caseSensitiveHook],
			}));

			const result = await applyHooksByType("hello Hello HELLO", "input");

			expect(result.modified).toBe("hello Hi HELLO");
		});
	});

	describe("convenience functions", () => {
		beforeEach(() => {
			const testHook: ReplaceHook = {
				id: "test-hook",
				name: "Test Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "rule1",
						name: "Rule 1",
						enabled: true,
						from: "test",
						to: "processed",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			// Add hooks for different types
			replaceHooks.update((config) => ({
				...config,
				inputHooks: [{ ...testHook, type: "input" as const }],
				outputHooks: [{ ...testHook, type: "output" as const }],
				requestHooks: [{ ...testHook, type: "request" as const }],
				displayHooks: [{ ...testHook, type: "display" as const }],
			}));
		});

		it("should apply input hooks correctly", async () => {
			const result = await applyInputHooks("test input");
			expect(result.modified).toBe("processed input");
		});

		it("should apply output hooks correctly", async () => {
			const result = await applyOutputHooks("test output");
			expect(result.modified).toBe("processed output");
		});

		it("should apply request hooks correctly", async () => {
			const result = await applyRequestHooks("test request");
			expect(result.modified).toBe("processed request");
		});

		it("should apply display hooks correctly", async () => {
			const result = await applyDisplayHooks("test display");
			expect(result.modified).toBe("processed display");
		});
	});

	describe("applyAllHooks", () => {
		it("should apply all hook types in sequence", async () => {
			const inputHook: ReplaceHook = {
				id: "input-hook",
				name: "Input Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "rule1",
						name: "Rule 1",
						enabled: true,
						from: "original",
						to: "input-processed",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			const outputHook: ReplaceHook = {
				id: "output-hook",
				name: "Output Hook",
				type: "output",
				enabled: true,
				rules: [
					{
						id: "rule2",
						name: "Rule 2",
						enabled: true,
						from: "input-processed",
						to: "output-processed",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [inputHook],
				outputHooks: [outputHook],
			}));

			const result = await applyAllHooks("original text");

			expect(result.afterInput.modified).toBe("input-processed text");
			expect(result.afterOutput.modified).toBe("output-processed text");
			expect(result.afterRequest.modified).toBe("output-processed text");
			expect(result.afterDisplay.modified).toBe("output-processed text");
		});
	});

	describe("rule iteration and infinite loop prevention", () => {
		it("should limit iterations to prevent infinite loops", async () => {
			const problematicHook: ReplaceHook = {
				id: "problematic-hook",
				name: "Problematic Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "loop-rule",
						name: "Loop Rule",
						enabled: true,
						from: "a",
						to: "aa",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [problematicHook],
			}));

			const result = await applyHooksByType("a", "input", {
				maxIterations: 3,
			});

			// Should not grow indefinitely due to maxIterations limit
			expect(result.modified.length).toBe(8);
			expect(result.appliedRules).toHaveLength(1);
		});

		it("should stop applying rule when no more changes occur", async () => {
			const hook: ReplaceHook = {
				id: "stable-hook",
				name: "Stable Hook",
				type: "input",
				enabled: true,
				rules: [
					{
						id: "stable-rule",
						name: "Stable Rule",
						enabled: true,
						from: "hello",
						to: "hello",
						useRegex: false,
						caseSensitive: false,
					},
				],
				priority: 10,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			replaceHooks.update((config) => ({
				...config,
				inputHooks: [hook],
			}));

			const result = await applyHooksByType("hello world", "input");

			expect(result.modified).toBe("hello world");
			expect(result.appliedRules).toHaveLength(1);
			expect(result.appliedRules[0].matchCount).toBe(0);
		});
	});
});
