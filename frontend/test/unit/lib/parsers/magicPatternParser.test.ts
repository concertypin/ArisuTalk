import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseMagicPatterns, type MagicPatternContext } from "@/lib/parsers/magicPatternParser";
import type { Character } from "@arisutalk/character-spec/v0/Character";

// Mock the scripting worker
const mockExecute = vi.fn();
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

describe("magicPatternParser", () => {
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
        } satisfies Character,
        persona: { name: "Test User" },
        chat: () => [],
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns text unchanged if no patterns found", async () => {
        const input = "Hello world";
        const result = await parseMagicPatterns(input, mockContext);
        expect(result).toBe(input);
        expect(mockExecute).not.toHaveBeenCalled();
    });

    it("evaluates pattern and replaces it with result", async () => {
        mockExecute.mockResolvedValue({
            result: "test",
            logs: [],
        });

        const input = "Hello {| return 'test' |} world";
        const result = await parseMagicPatterns(input, mockContext);

        expect(result).toBe("Hello test world");
        expect(mockExecute).toHaveBeenCalled();
    });
});
