import { describe, it, expect, expectTypeOf } from "vitest";
import { parseMagicPatterns, type MagicPatternContext } from "@/lib/parsers/magicPatternParser";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

describe("MagicPatternParser", () => {
    // Mock context for testing
    const mockContext: MagicPatternContext = {
        character: {
            id: "char-1",
            name: "Test Character",
            specVersion: 0,
            description: "A test character",
            assets: { assets: [] },
            prompt: {
                description: "",
                lorebook: { config: {}, data: [] },
            },
            executables: {
                runtimeSetting: { timeout: 30000 },
                replaceHooks: { display: [], input: [], output: [], request: [] },
            },
            metadata: { license: "" },
        },
        persona: {
            name: "User",
            description: "Test user persona",
        },
        chat: (_a: number, _b: number): Message[] => [],
    };

    describe("Type Tests", () => {
        it("MagicPatternContext has correct structure", () => {
            expectTypeOf<MagicPatternContext>().toExtend<{
                character: Character;
                persona: { name: string };
            }>();
        });

        it("parseMagicPatterns returns Promise<string>", () => {
            expectTypeOf(parseMagicPatterns).returns.toExtend<Promise<string>>();
        });

        it("chat function has correct signature", () => {
            expectTypeOf(mockContext.chat).parameters.toEqualTypeOf<[number, number]>();
            expectTypeOf(mockContext.chat).returns.toEqualTypeOf<Message[]>();
        });
    });

    describe("parseMagicPatterns()", () => {
        it("returns text unchanged when no patterns present", async () => {
            const input = "Hello, world!";
            const result = await parseMagicPatterns(input, mockContext);
            expect(result).toBe(input);
        });

        it("returns text unchanged when patterns are present (placeholder implementation)", async () => {
            const input = "Hello {| return character.name |}!";
            const result = await parseMagicPatterns(input, mockContext);
            // Current placeholder implementation returns text as-is
            expect(result).toBe(input);
        });

        it("handles empty string", async () => {
            const result = await parseMagicPatterns("", mockContext);
            expect(result).toBe("");
        });

        it("handles multiline text", async () => {
            const input = "Line 1\nLine 2\nLine 3";
            const result = await parseMagicPatterns(input, mockContext);
            expect(result).toBe(input);
        });

        it("handles text with special characters", async () => {
            const input = "Special chars: <>&\"'`${}[]";
            const result = await parseMagicPatterns(input, mockContext);
            expect(result).toBe(input);
        });
    });

    describe("Edge Cases", () => {
        it("handles context with optional description", async () => {
            const contextWithoutDesc: MagicPatternContext = {
                ...mockContext,
                persona: { name: "User" },
            };
            const result = await parseMagicPatterns("Test", contextWithoutDesc);
            expect(result).toBe("Test");
        });

        it("handles empty chat history", async () => {
            expect(mockContext.chat(0, 0)).toEqual([]);
        });
    });
});
