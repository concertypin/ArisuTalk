import { describe, it, expect, vi } from "vitest";
import { parseMagicPatterns, type MagicPatternContext } from "@/lib/parsers/magicPatternParser";
import type { Character } from "@arisutalk/character-spec/v0/Character";

describe("magicPatternParser", () => {
    const mockContext: MagicPatternContext = {
        character: {} as Character,
        persona: { name: "Test User" },
        chat: vi.fn(),
    };

    it("returns text unchanged if no patterns found", async () => {
        const input = "Hello world";
        const result = await parseMagicPatterns(input, mockContext);
        expect(result).toBe(input);
    });

    it("logs error and returns text unchanged if pattern found (placeholder behavior)", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const input = "Hello {| return 'test' |} world";
        const result = await parseMagicPatterns(input, mockContext);

        expect(result).toBe(input);
        // adze logger calls console.error differently in Node vs Browser:
        // - Node: [" Error     ", "[ArisuTalk] ", "message"]
        // - Browser: ["%c Error", "CSS styles...", "message"]
        // So we just verify it was called and check the last argument contains our message
        expect(consoleSpy).toHaveBeenCalled();
        const lastCall = consoleSpy.mock.calls[0] as unknown[];
        const messageArg = lastCall?.find(
            (arg): arg is string =>
                typeof arg === "string" && arg.includes("Parser not implemented yet")
        );
        expect(messageArg).toBeDefined();

        consoleSpy.mockRestore();
    });
});
