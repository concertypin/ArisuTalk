/**
 * @fileoverview Tests for the token counter utility.
 */
import { describe, it, expect, expectTypeOf } from "vitest";
import { countTokens, estimateTokenCost } from "@/lib/utils/tokenCounter";

describe("Token Counter", () => {
    describe("countTokens()", () => {
        it("returns 0 for empty string", () => {
            expect(countTokens("")).toBe(0);
        });

        it("returns 0 for nullish/undefined", () => {
            // @ts-expect-error - testing with undefined (non-null assertion)
            expect(countTokens(undefined)).toBe(0);
        });

        it("returns correct count for empty string variants", () => {
            expect(countTokens("   ")).toBe(1);
        });

        it("returns positive number for non-empty text", () => {
            expect(countTokens("hello world")).toBeGreaterThan(0);
        });

        it("produces approximately 1 token per 4 characters for ASCII text", () => {
            const text = "The quick brown fox jumps over the lazy dog";
            // 44 chars / 4 = 11 tokens
            expect(countTokens(text)).toBe(11);
        });

        it("handles Unicode/multi-byte characters", () => {
            // CJK characters are 3 bytes each
            const cjk = "你好世界";
            expect(countTokens(cjk)).toBe(3); // 12 bytes / 4 = 3
        });

        it("handles mixed ASCII and Unicode", () => {
            const mixed = "hello 世界";
            expect(countTokens(mixed)).toBe(3); // 11 bytes / 4 = 2.75 → ceil 3
        });

        it("handles long texts", () => {
            const long = "a".repeat(400);
            expect(countTokens(long)).toBe(100); // 400 / 4 = 100
        });

        it("handles text with newlines and special characters", () => {
            const text = "line1\nline2\nline3\t!@#$%";
            expect(countTokens(text)).toBeGreaterThan(0);
        });
    });

    describe("estimateTokenCost()", () => {
        it("returns object with tokens and cost", () => {
            const result = estimateTokenCost("hello world");
            expect(result).toHaveProperty("tokens");
            expect(result).toHaveProperty("cost");
            expectTypeOf(result.tokens).toBeNumber();
            expectTypeOf(result.cost).toBeNumber();
        });

        it("uses default model when none specified", () => {
            const defaultResult = estimateTokenCost("hello world");
            const explicitResult = estimateTokenCost("hello world", "gpt-4o-mini");
            expect(defaultResult.cost).toBe(explicitResult.cost);
        });

        it("computes cost based on model rate", () => {
            // gpt-4 is much more expensive than gpt-4o-mini
            const cheapResult = estimateTokenCost("a".repeat(4000), "gpt-4o-mini");
            const expensiveResult = estimateTokenCost("a".repeat(4000), "gpt-4");
            expect(expensiveResult.cost).toBeGreaterThan(cheapResult.cost);
        });

        it("returns 0 cost for empty text", () => {
            const result = estimateTokenCost("");
            expect(result.tokens).toBe(0);
            expect(result.cost).toBe(0);
        });

        it("uses default fallback rate for unknown models", () => {
            const result = estimateTokenCost("a".repeat(4000), "unknown-model");
            // default rate is 0.002 per 1K tokens
            // 1000 tokens * 0.002 / 1000 = 0.002
            expect(result.cost).toBeCloseTo(0.002, 5);
        });

        it("handles known model rates correctly", () => {
            // gpt-4o at $0.0025/1K tokens
            const result = estimateTokenCost("a".repeat(4000), "gpt-4o");
            // 1000 tokens * 0.0025 / 1000 = 0.0025
            expect(result.tokens).toBe(1000);
            expect(result.cost).toBeCloseTo(0.0025, 5);
        });
    });
});
