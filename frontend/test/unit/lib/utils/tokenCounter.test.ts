/**
 * @fileoverview Tests for the token counter utility.
 */
import { describe, it, expect } from "vitest";
import { estimateTokens } from "@/lib/utils/tokenCounter";

describe.concurrent("Token Counter", () => {
    describe.concurrent("estimateTokens()", () => {
        it("returns 0 for empty string", () => {
            expect(estimateTokens("")).toBe(0);
        });

        it("returns 0 for nullish/undefined", () => {
            // @ts-expect-error - testing with undefined (non-null assertion)
            expect(estimateTokens(undefined)).toBe(0);
        });

        it("returns correct count for empty string variants", () => {
            expect(estimateTokens("   ")).toBe(1);
        });

        it("returns positive number for non-empty text", () => {
            expect(estimateTokens("hello world")).toBeGreaterThan(0);
        });

        it("produces approximately 1 token per 4 characters for ASCII text", () => {
            const text = "The quick brown fox jumps over the lazy dog";
            // 44 chars / 4 = 11 tokens
            expect(estimateTokens(text)).toBe(11);
        });

        it("handles Unicode/multi-byte characters", () => {
            // CJK characters are 3 bytes each
            const cjk = "你好世界";
            expect(estimateTokens(cjk)).toBe(3); // 12 bytes / 4 = 3
        });

        it("handles mixed ASCII and Unicode", () => {
            const mixed = "hello 世界";
            expect(estimateTokens(mixed)).toBe(3); // 11 bytes / 4 = 2.75 → ceil 3
        });

        it("handles long texts", () => {
            const long = "a".repeat(400);
            expect(estimateTokens(long)).toBe(100); // 400 / 4 = 100
        });

        it("handles text with newlines and special characters", () => {
            const text = "line1\nline2\nline3\t!@#$%";
            expect(estimateTokens(text)).toBeGreaterThan(0);
        });
    });
});
