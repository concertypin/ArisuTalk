import { describe, it, expect, vi, beforeEach } from "vitest";
import { HookService } from "@/lib/services/HookService";
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";

// Mock workers
vi.mock("@/lib/workers/workerClient", () => ({
    getRegexWorker: vi.fn(async () => ({
        replace: vi.fn(
            async (text: string, pattern: string, replacement: string, flags: string) => {
                const re = new RegExp(pattern, flags || "g");
                return text.replace(re, replacement);
            }
        ),
    })),
    getScriptingWorker: vi.fn(async () => ({
        execute: vi.fn(async (code: string) => ({
            // Since scripts are user-defined, it might be `any` type.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            result: code.includes("return") ? eval(`(() => { ${code} })()`) : eval(code),
            logs: [],
        })),
    })),
}));

describe("HookService", () => {
    let hookService: HookService;

    beforeEach(() => {
        hookService = new HookService();
    });

    it("should apply a simple regex hook", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: {
                description: "",
            },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "apple",
                            output: "orange",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        const result = await hookService.process("I have an apple", character, "input");
        expect(result).toBe("I have an orange");
    });

    it("should respect priorities", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: {
                description: "",
            },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "apple",
                            output: "orange",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                                priority: 10,
                            },
                        },
                        {
                            input: "orange",
                            output: "banana",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                                priority: 5,
                            },
                        },
                    ],
                },
            },
        });

        // Higher priority (apple -> orange) runs first, then (orange -> banana)
        const result = await hookService.process("apple", character, "input");
        expect(result).toBe("banana");
    });

    it("should handle scripted patterns", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: {
                description: "",
            },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "'app' + 'le'",
                            output: "fruit",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: true,
                                isOutputScripted: false,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        const result = await hookService.process("an apple", character, "input");
        expect(result).toBe("an fruit");
    });
});
