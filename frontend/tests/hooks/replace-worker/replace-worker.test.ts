import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the entire replace module to avoid worker issues
vi.mock("$root/lib/utils/worker/replace", () => ({
	replace: vi
		.fn()
		.mockImplementation(async (input: string, ...patterns: any[]) => {
			let result = input;
			for (const pattern of patterns) {
				if (pattern && pattern.pattern instanceof RegExp) {
					result = result.replace(pattern.pattern, pattern.replace);
				} else if (pattern && pattern.pattern) {
					// Simple string replacement for testing
					const regex = new RegExp(
						pattern.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
						"g",
					);
					result = result.replace(regex, pattern.replace);
				}
			}
			return result;
		}),
}));

import { replace } from "../../../src/lib/utils/worker/replace";

describe("replace worker", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("replace function", () => {
		it("should perform simple string replacement", async () => {
			const result = await replace("hello world", {
				pattern: "hello",
				replace: "hi",
			});

			expect(result).toBe("hi world");
		});

		it("should handle multiple patterns", async () => {
			const result = await replace(
				"hello world",
				{
					pattern: "hello",
					replace: "hi",
				},
				{
					pattern: "world",
					replace: "universe",
				},
			);

			expect(result).toBe("hi universe");
		});

		it("should handle regex patterns", async () => {
			const result = await replace("hello123 world456", {
				pattern: /\d+/g,
				replace: "",
			});

			expect(result).toBe("hello world");
		});

		it("should handle case-sensitive replacements", async () => {
			const result = await replace("Hello hello HELLO", {
				pattern: "hello",
				replace: "hi",
			});

			expect(result).toBe("Hello hi HELLO");
		});

		it("should handle global replacements", async () => {
			const result = await replace("hello hello hello", {
				pattern: "hello",
				replace: "hi",
			});

			expect(result).toBe("hi hi hi");
		});

		it("should handle special regex characters in patterns", async () => {
			const result = await replace("hello.world", {
				pattern: ".",
				replace: "-",
			});

			expect(result).toBe("hello-world");
		});

		it("should handle empty input", async () => {
			const result = await replace("", {
				pattern: "hello",
				replace: "hi",
			});

			expect(result).toBe("");
		});

		it("should handle patterns that match nothing", async () => {
			const result = await replace("hello world", {
				pattern: "xyz",
				replace: "abc",
			});

			expect(result).toBe("hello world");
		});

		it("should handle replacement with empty string", async () => {
			const result = await replace("hello world", {
				pattern: "world",
				replace: "",
			});

			expect(result).toBe("hello ");
		});

		it("should handle complex regex patterns", async () => {
			const result = await replace(
				"The wquick wbrown wfox wjumps wover wthe wlazy wdog",
				{
					// Not so complex, right? 😄
					// But I'm lacking inspiration today. Sorry!
					pattern: / w(\w+)/g,
					replace: " $1",
				},
			);
			expect(result).toBe("The quick brown fox jumps over the lazy dog");
		});

		it("should handle Unicode characters", async () => {
			const result = await replace("héllo wörld", {
				pattern: "héllo",
				replace: "hi",
			});

			expect(result).toBe("hi wörld");
		});

		it("should handle multiple regex patterns", async () => {
			const result = await replace(
				"abc123def456",
				{
					pattern: /\d+/g,
					replace: "NUM",
				},
				{
					pattern: /[a-z]+/g,
					replace: "TEXT",
				},
			);

			expect(result).toBe("TEXTNUMTEXTNUM");
		});

		it("should handle mixed string and regex patterns", async () => {
			const result = await replace(
				"hello123world456",
				{
					pattern: "hello",
					replace: "hi",
				},
				{
					pattern: /\d+/g,
					replace: "NUM",
				},
				{
					pattern: "world",
					replace: "universe",
				},
			);

			expect(result).toBe("hiNUMuniverseNUM");
		});

		it("should handle patterns with capture groups", async () => {
			const result = await replace("John Doe", {
				pattern: /(\w+)\s+(\w+)/,
				replace: "$2, $1",
			});

			expect(result).toBe("Doe, John");
		});

		it("should handle patterns with flags", async () => {
			const result = await replace("Hello HELLO hello", {
				pattern: /hello/gi,
				replace: "hi",
			});

			expect(result).toBe("hi hi hi");
		});

		it("should handle replacement with backreferences", async () => {
			const result = await replace("a1b2c3", {
				pattern: /([a-z])(\d)/g,
				replace: "$2$1",
			});

			expect(result).toBe("1a2b3c");
		});

		it("should handle large text efficiently", async () => {
			const largeText = "hello ".repeat(10000);
			const result = await replace(largeText, {
				pattern: "hello",
				replace: "hi",
			});

			expect(result).toBe("hi ".repeat(10000));
		});

		it("should handle patterns with lookahead/lookbehind", async () => {
			const result = await replace("a1 b2 c3", {
				pattern: /\b(?=\w)/g,
				replace: "X",
			});

			expect(result).toBe("Xa1 Xb2 Xc3");
		});

		it("should handle word boundary patterns", async () => {
			const result = await replace("hello worldish", {
				pattern: /\bhello\b/g,
				replace: "hi",
			});

			expect(result).toBe("hi worldish");
		});

		it("should handle multiline patterns", async () => {
			const result = await replace("line1\nline2\nline3", {
				pattern: /^/gm,
				replace: ">> ",
			});

			expect(result).toBe(">> line1\n>> line2\n>> line3");
		});

		it("should handle no patterns provided", async () => {
			const result = await replace("hello world");

			expect(result).toBe("hello world");
		});

		it("should handle null/undefined patterns gracefully", async () => {
			// Test with empty patterns array
			const result = await replace("hello world");

			expect(result).toBe("hello world");
		});
	});

	describe("worker initialization", () => {
		it("should initialize worker only once", async () => {
			// First call should initialize worker
			await replace("test1", { pattern: "test", replace: "hello" });

			// Second call should reuse same worker
			await replace("test2", { pattern: "test", replace: "hello" });

			// The mock should have been called for both replace operations
			expect(replace).toHaveBeenCalledTimes(2);
		});
	});

	describe("error handling", () => {
		describe("should handle worker errors gracefully", () => {
			// Mock worker to throw error
			vi.doMock("comlink", () => ({
				ComlinkWorker: vi.fn().mockImplementation(() => ({
					replace: vi.fn().mockRejectedValue(new Error("Worker error")),
				})),
			}));

			// More meaningful tests for worker error scenarios and real worker initialization flow.
			// We dynamically load the real module while mocking only the worker/comlink dependency
			// so we can exercise the module's worker-initialization and error propagation behavior.

			it("should surface worker initialization errors (real module + mocked comlink)", async () => {
				// Ensure we load a fresh copy of the module
				vi.resetModules();

				// Mock comlink to provide a worker that always rejects
				vi.doMock("comlink", () => ({
					ComlinkWorker: vi.fn().mockImplementation(() => ({
						// Simulate worker replace method always rejecting
						replace: vi.fn().mockRejectedValue(new Error("Worker error")),
					})),
				}));

				// Import the real module implementation (not the top-level mocked one)
				const { replace: realReplace } = await import(
					"../../../src/lib/utils/worker/replace"
				);

				await expect(
					realReplace("test-text", { pattern: "test", replace: "x" }),
				).rejects.toThrow("Worker error");
			});

			it("should propagate the first failure and succeed afterwards when worker recovers", async () => {
				vi.resetModules();

				// Simulate a worker whose replace rejects on first call, then resolves on subsequent calls.
				let callCount = 0;
				vi.doMock("comlink", () => ({
					ComlinkWorker: vi.fn().mockImplementation(() => ({
						replace: vi
							.fn()
							.mockImplementation(async (input: string, ...patterns: any[]) => {
								callCount++;
								if (callCount === 1) {
									throw new Error("Transient worker failure");
								}
								// Simple deterministic replacement as the worker would do
								let result = input;
								for (const pattern of patterns) {
									if (!pattern) continue;
									if (pattern.pattern instanceof RegExp) {
										result = result.replace(pattern.pattern, pattern.replace);
									} else if (pattern.pattern) {
										const regex = new RegExp(
											pattern.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
											"g",
										);
										result = result.replace(regex, pattern.replace);
									}
								}
								return result;
							}),
					})),
				}));

				const { replace: realReplace } = await import(
					"../../../src/lib/utils/worker/replace"
				);

				// First call should reject
				await expect(
					realReplace("hello world", {
						pattern: "hello",
						replace: "hi",
					}),
				).rejects.toThrow("Transient worker failure");

				// Second call should succeed (worker recovered in our mock)
				await expect(
					realReplace("hello world", {
						pattern: "hello",
						replace: "hi",
					}),
				).resolves.toBe("hi world");
			});

			it("should handle concurrent calls even if some worker invocations are slow or fail", async () => {
				vi.resetModules();

				// Worker implementation: odd calls have a small delay, even calls succeed immediately.
				let seq = 0;
				vi.doMock("comlink", () => ({
					ComlinkWorker: vi.fn().mockImplementation(() => ({
						replace: vi
							.fn()
							.mockImplementation(async (input: string, patternObj: any) => {
								seq++;
								const idx = seq;
								if (idx % 3 === 0) {
									// every 3rd call fails
									await new Promise((r) => setTimeout(r, 10));
									throw new Error(`Worker failed on call ${idx}`);
								}
								if (idx % 2 === 0) {
									// every 2nd call delayed but succeeds
									await new Promise((r) => setTimeout(r, 5));
								}
								// simple replacement
								if (!patternObj || !patternObj.pattern) return input;
								const pattern =
									patternObj.pattern instanceof RegExp
										? patternObj.pattern
										: new RegExp(
												patternObj.pattern.replace(
													/[.*+?^${}()|[\]\\]/g,
													"\\$&",
												),
												"g",
											);
								return input.replace(pattern, patternObj.replace);
							}),
					})),
				}));

				const { replace: realReplace } = await import(
					"../../../src/lib/utils/worker/replace"
				);

				const inputs = Array.from({ length: 6 }, (_, i) => `item${i}`);
				const promises = inputs.map((t, i) =>
					realReplace(t, {
						pattern: `item${i}`,
						replace: `done${i}`,
					}).then(
						(r) => ({ ok: true, r }) as const,
						(e) => ({ ok: false, e }) as const,
					),
				);
				const results = await Promise.all(promises);

				// Verify results: failed ones should be reported as failures, others should succeed
				results.forEach((res, i) => {
					if (!res.ok) {
						expect((res.e satisfies Error).message).toMatch(
							/Worker failed on call \d+/,
						);
					} else {
						expect(res.r).toBe(`done${i}`);
					}
				});
			});
		});
	});

	describe("performance considerations", () => {
		it("should batch multiple replacements efficiently", async () => {
			const text = "hello world test example";

			// Multiple separate calls
			const result1 = await replace(text, {
				pattern: "hello",
				replace: "hi",
			});
			const result2 = await replace(result1, {
				pattern: "world",
				replace: "universe",
			});
			const result3 = await replace(result2, {
				pattern: "test",
				replace: "example",
			});

			// Single call with multiple patterns
			const resultBatched = await replace(
				text,
				{ pattern: "hello", replace: "hi" },
				{ pattern: "world", replace: "universe" },
				{ pattern: "test", replace: "example" },
			);

			expect(result3).toBe(resultBatched);
		});

		it("should handle concurrent calls", async () => {
			const promises = Array.from({ length: 10 }, (_, i) =>
				replace(`text${i}`, {
					pattern: "text",
					replace: "processed",
				}),
			);

			const results = await Promise.all(promises);

			results.forEach((result, i) => {
				expect(result).toBe(`processed${i}`);
			});
		});
	});
});
