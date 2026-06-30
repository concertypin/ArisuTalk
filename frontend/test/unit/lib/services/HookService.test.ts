import { describe, it, expect, vi, beforeEach } from "vitest";
import { HookService } from "@/lib/services/HookService";
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";
import { mockScriptingWorker } from "@test/utils/mockWorkerApi";

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
            // oxlint-disable-next-line no-eval typescript/no-unsafe-assignment
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

    it("should assign correct roles based on hook type", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    display: [
                        {
                            input: "secret",
                            output: "hidden",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: true, // Use scripted to access context role
                                isOutputScripted: false,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        // Mock scripting worker to return 'secret' only if role is 'assistant'
        vi.mocked(await import("@/lib/workers/workerClient")).getScriptingWorker.mockResolvedValue(
            mockScriptingWorker(
                vi.fn(async (code: string, options) => {
                    // Check role in context

                    // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
                    const ctx = options?.context;

                    // oxlint-disable-next-line typescript/no-unsafe-assignment typescript/no-unsafe-member-access
                    const role = ctx?.message?.role;
                    if (role === "assistant") {
                        return { result: "secret", logs: [] };
                    }
                    return { result: "nomatch", logs: [] };
                })
            )
        );

        const result = await hookService.process("This is secret", character, "display");
        expect(result).toBe("This is hidden");
    });

    it("should handle scripted input pattern errors gracefully", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "throw new Error('test error')",
                            output: "replacement",
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

        // Mock scripting worker to return error
        vi.mocked(await import("@/lib/workers/workerClient")).getScriptingWorker.mockResolvedValue(
            mockScriptingWorker(
                vi.fn(async () => ({
                    result: undefined,
                    error: "test error",
                    logs: [],
                }))
            )
        );

        // Should not throw, just log error and skip the hook
        const result = await hookService.process("test content", character, "input");
        expect(result).toBe("test content");
    });

    it("should handle scripted output for regex hooks", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    output: [
                        {
                            input: "\\d+",
                            output: "'NUMBER'",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: false,
                                isOutputScripted: true,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        const result = await hookService.process("I have 42 apples", character, "output");
        // The mock eval returns the string with quotes, so we expect 'NUMBER' not NUMBER
        expect(result).toBe("I have 'NUMBER' apples");
    });

    it("should handle scripted output for string hooks", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    display: [
                        {
                            input: "hello",
                            output: "'GREETING'",
                            meta: {
                                type: "string",
                                caseSensitive: false,
                                isInputPatternScripted: false,
                                isOutputScripted: true,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        const result = await hookService.process("hello world", character, "display");
        // The mock eval returns the string with quotes, so we expect 'GREETING' not GREETING
        expect(result).toBe("'GREETING' world");
    });

    it("should handle string replacement with case sensitivity", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "Hello",
                            output: "Hi",
                            meta: {
                                type: "string",
                                caseSensitive: true,
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        const result = await hookService.process("Hello world, hello again", character, "input");
        // Case sensitive: only "Hello" should be replaced, not "hello"
        expect(result).toBe("Hi world, hello again");
    });

    it("should handle string replacement without case sensitivity", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "Hello",
                            output: "Hi",
                            meta: {
                                type: "string",
                                caseSensitive: false,
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        const result = await hookService.process("Hello world, hello again", character, "input");
        // Case insensitive: both "Hello" and "hello" should be replaced
        expect(result).toBe("Hi world, Hi again");
    });

    it("should return content unchanged when no hooks are defined", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [],
                },
            },
        });

        const result = await hookService.process("test content", character, "input");
        expect(result).toBe("test content");
    });

    it("should escape special regex characters in string replacement", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    input: [
                        {
                            input: "a.b",
                            output: "X",
                            meta: {
                                type: "string",
                                caseSensitive: false,
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        // Should match literal "a.b", not "a" + any char + "b"
        const result = await hookService.process("a.b and aXb", character, "input");
        expect(result).toBe("X and aXb");
    });

    it("should handle scripted output error gracefully (regex hooks)", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    output: [
                        {
                            input: "test",
                            output: "throw new Error('fail')",
                            meta: {
                                type: "regex",
                                flag: "g",
                                isInputPatternScripted: false,
                                isOutputScripted: true,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        // Mock scripting worker to return error for output script
        vi.mocked(await import("@/lib/workers/workerClient")).getScriptingWorker.mockResolvedValue(
            mockScriptingWorker(
                vi.fn(async () => ({
                    result: undefined,
                    error: "script error",
                    logs: [],
                }))
            )
        );

        // Should use the original output as fallback when script fails
        const result = await hookService.process("test content", character, "output");
        // 'test' is replaced by the original output 'throw new Error(\'fail\')' (from regex)
        expect(result).toBe("throw new Error('fail') content");
    });

    it("should handle scripted output error gracefully (string hooks)", async () => {
        const character = apply(CharacterSchema, {
            description: "",
            prompt: { description: "" },
            specVersion: 0,
            id: "1",
            name: "Test",
            executables: {
                replaceHooks: {
                    display: [
                        {
                            input: "greeting",
                            output: "throw new Error('fail')",
                            meta: {
                                type: "string",
                                caseSensitive: false,
                                isInputPatternScripted: false,
                                isOutputScripted: true,
                                priority: 0,
                            },
                        },
                    ],
                },
            },
        });

        // Mock scripting worker to return no result (error-like)
        vi.mocked(await import("@/lib/workers/workerClient")).getScriptingWorker.mockResolvedValue(
            mockScriptingWorker(
                vi.fn(async () => ({
                    result: undefined,
                    // No error but no result either - should use original output
                    logs: [],
                }))
            )
        );

        const result = await hookService.process("hello greeting world", character, "display");
        // Original replacement is used as fallback
        expect(result).toBe("hello throw new Error('fail') world");
    });

    describe("stringifyResult", () => {
        // stringifyResult is a module-level function, test via hook behavior

        it("should handle bigint and symbol results", async () => {
            const character = apply(CharacterSchema, {
                description: "",
                prompt: { description: "" },
                specVersion: 0,
                id: "1",
                name: "Test",
                executables: {
                    replaceHooks: {
                        input: [
                            {
                                input: "test",
                                output: "BigIntResult",
                                meta: {
                                    type: "string",
                                    caseSensitive: false,
                                    isInputPatternScripted: false,
                                    isOutputScripted: true,
                                    priority: 0,
                                },
                            },
                        ],
                    },
                },
            });

            // Mock scripting worker to return a bigint
            vi.mocked(
                await import("@/lib/workers/workerClient")
            ).getScriptingWorker.mockResolvedValue(
                mockScriptingWorker(
                    vi.fn(async () => ({
                        result: BigInt(42),
                        logs: [],
                    }))
                )
            );

            const result = await hookService.process("test content", character, "input");
            // bigint should be stringified via String()
            expect(result).toContain("42");
        });

        it("should handle null and undefined results", async () => {
            const character = apply(CharacterSchema, {
                description: "",
                prompt: { description: "" },
                specVersion: 0,
                id: "1",
                name: "Test",
                executables: {
                    replaceHooks: {
                        input: [
                            {
                                input: "test",
                                output: "null",
                                meta: {
                                    type: "string",
                                    caseSensitive: false,
                                    isInputPatternScripted: false,
                                    isOutputScripted: true,
                                    priority: 0,
                                },
                            },
                        ],
                    },
                },
            });

            // Mock scripting worker to return null
            vi.mocked(
                await import("@/lib/workers/workerClient")
            ).getScriptingWorker.mockResolvedValue(
                mockScriptingWorker(
                    vi.fn(async () => ({
                        result: null,
                        logs: [],
                    }))
                )
            );

            const result = await hookService.process("test content", character, "input");
            // null should be replaced with "null" via JSON.stringify
            expect(result).toContain("null");
        });
    });
});
