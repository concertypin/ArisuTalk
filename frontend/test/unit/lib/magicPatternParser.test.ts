import { describe, it, expect, expectTypeOf, vi } from "vitest";
import { parseMagicPatterns, type MagicPatternContext } from "@/lib/parsers/magicPatternParser";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { ScriptingWorkerApi } from "@worker/scripting/types";

// Mock the scripting worker
const mockExecute = vi.fn<ScriptingWorkerApi["execute"]>();
vi.mock("@/lib/workers/workerClient", () => ({
    getScriptingWorker: vi.fn(() =>
        Promise.resolve({
            execute: mockExecute,
            setLogReceiver: vi.fn(),
            terminate: vi.fn(),
            disabled: false,
        })
    ),
}));

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
        chat: (_a: number, _b: number) => [],
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

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
            // eslint-disable-next-line @typescript-eslint/unbound-method
            const chatFn = mockContext.chat;
            expectTypeOf(chatFn).parameters.toEqualTypeOf<[number, number]>();
        });
    });

    describe("parseMagicPatterns()", () => {
        it("returns text unchanged when no patterns present", async () => {
            const input = "Hello, world!";
            const result = await parseMagicPatterns(input, mockContext);
            expect(result).toBe(input);
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it("evaluates magic patterns using the scripting worker", async () => {
            mockExecute.mockResolvedValue({
                result: "Test Character",
                logs: [],
            });

            const input = "Hello {| return character.name |}!";
            const result = await parseMagicPatterns(input, mockContext);

            expect(result).toBe("Hello Test Character!");
            expect(mockExecute).toHaveBeenCalledTimes(1);
            // Verify the executed code contains the character context
            const [code] = mockExecute.mock.calls[0] as [string];
            expect(code).toContain("const character");
            expect(code).toContain("return character.name");
        });

        it("evaluates expression-style patterns", async () => {
            mockExecute.mockResolvedValue({
                result: 42,
                logs: [],
            });

            const input = "The answer is {| 21 + 21 |}.";
            const result = await parseMagicPatterns(input, mockContext);

            expect(result).toBe("The answer is 42.");
        });

        it("handles multiple patterns in one text", async () => {
            mockExecute
                .mockResolvedValueOnce({ result: "Alice", logs: [] })
                .mockResolvedValueOnce({ result: "Bob", logs: [] });

            const input = "{| character.name |} and {| persona.name |}";
            const result = await parseMagicPatterns(input, mockContext);

            expect(result).toBe("Alice and Bob");
            expect(mockExecute).toHaveBeenCalledTimes(2);
        });

        it("keeps original pattern text on script error", async () => {
            mockExecute.mockResolvedValue({
                result: undefined,
                error: "ReferenceError: foo is not defined",
                logs: [],
            });

            const input = "Hello {| return foo |} world";
            const result = await parseMagicPatterns(input, mockContext);

            // Pattern text is preserved on error
            expect(result).toBe(input);
        });

        it("handles empty string", async () => {
            const result = await parseMagicPatterns("", mockContext);
            expect(result).toBe("");
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it("handles multiline text without patterns", async () => {
            const input = "Line 1\nLine 2\nLine 3";
            const result = await parseMagicPatterns(input, mockContext);
            expect(result).toBe(input);
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it("handles text with special characters (no patterns)", async () => {
            const input = "Special chars: <>&\"'`${}[]";
            const result = await parseMagicPatterns(input, mockContext);
            expect(result).toBe(input);
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it("handles empty pattern (no code between braces)", async () => {
            const input = "Hello {|  |} world";
            const result = await parseMagicPatterns(input, mockContext);

            // Empty pattern kept as-is, no worker call
            expect(result).toBe(input);
            expect(mockExecute).not.toHaveBeenCalled();
        });
    });

    describe("Edge Cases", () => {
        it("handles context with optional description", async () => {
            mockExecute.mockResolvedValue({
                result: "User",
                logs: [],
            });

            const contextWithoutDesc: MagicPatternContext = {
                ...mockContext,
                persona: { name: "User" },
            };
            const result = await parseMagicPatterns("{| persona.name |}", contextWithoutDesc);
            expect(result).toBe("User");
        });

        it("handles falsy result values", async () => {
            mockExecute.mockResolvedValue({
                result: 0,
                logs: [],
            });

            const result = await parseMagicPatterns("{| 0 |}", mockContext);
            expect(result).toBe("0");
        });

        it("handles undefined result (no return)", async () => {
            mockExecute.mockResolvedValue({
                result: undefined,
                logs: [],
            });

            const result = await parseMagicPatterns("{| const x = 1 |}", mockContext);
            expect(result).toBe("");
        });
    });
});
