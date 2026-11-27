/**
 * HookService tests with the real regex worker logic and a Node `vm` stand-in for the scripting worker.
 *
 * Only the worker construction (`workerClient`) is mocked. The regex worker is the real `api` of
 * `worker/regex/main`, so patterns, replacements and flags go through real regex handling instead
 * of a mock re-implementation. Scripts run in `runInVm`, which is not the QuickJS sandbox; the
 * "real scripting worker" block at the end calls the real `api` of `worker/scripting/main`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { HookService } from "@/lib/services/HookService";
import { getRegexWorker, getScriptingWorker } from "@/lib/workers/workerClient";
import { api as regexApi } from "@worker/regex/main";
import { api as scriptingApi } from "@worker/scripting/main";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { apply } from "@arisutalk/character-spec/utils";
import { PersonaSchema, type Persona } from "@/features/persona/schema";
import { mockScriptingWorker, mockWorkerApi, runInVm } from "@test/utils/mockWorkerApi";
import { createTestCharacter } from "@test/utils/character";

vi.mock("comlink", () => ({ expose: vi.fn() }));
vi.mock("@/lib/workers/workerClient", () => ({
    getRegexWorker: vi.fn(),
    getScriptingWorker: vi.fn(),
}));

type ReplaceHooks = NonNullable<Character["executables"]>["replaceHooks"];
type Hook = ReplaceHooks["input"][number];
type HookMeta = Hook["meta"];
type MetaOverrides = {
    type?: "regex" | "string";
    flag?: string;
    caseSensitive?: boolean;
    scriptedInput?: boolean;
    scriptedOutput?: boolean;
    priority?: number;
};

function hook(input: string, output: string, overrides: MetaOverrides = {}): Hook {
    const meta: HookMeta =
        (overrides.type ?? "regex") === "regex"
            ? {
                  type: "regex",
                  flag: overrides.flag ?? "g",
                  isInputPatternScripted: overrides.scriptedInput ?? false,
                  isOutputScripted: overrides.scriptedOutput ?? false,
                  priority: overrides.priority ?? 0,
              }
            : {
                  type: "string",
                  caseSensitive: overrides.caseSensitive ?? false,
                  isInputPatternScripted: overrides.scriptedInput ?? false,
                  isOutputScripted: overrides.scriptedOutput ?? false,
                  priority: overrides.priority ?? 0,
              };
    return { input, output, meta };
}

/** The fixture character with the given hooks. */
function characterWith(hooks: Partial<ReplaceHooks>): Character {
    return createTestCharacter({
        id: "char-hooks",
        name: "Hooked",
        description: "",
        executables: { replaceHooks: hooks },
    });
}

describe("HookService with scripted hooks", () => {
    let service: HookService;
    let logs: AnyLogEntry[];
    let detach: () => void;
    const execute = vi.fn(runInVm);

    beforeEach(() => {
        // The worker getters are module mocks, so call history from earlier tests would leak into not.toHaveBeenCalled().
        vi.clearAllMocks();
        service = new HookService();
        execute.mockReset();
        execute.mockImplementation(runInVm);
        vi.mocked(getRegexWorker).mockResolvedValue(mockWorkerApi(regexApi));
        vi.mocked(getScriptingWorker).mockResolvedValue(mockScriptingWorker(execute));
        logs = [];
        detach = Logger.onLog((entry) => logs.push(entry));
    });

    afterEach(() => {
        detach();
    });

    describe("without hooks", () => {
        it("returns the content as is without starting any worker", async () => {
            const character = characterWith({ input: [] });

            expect(await service.process("keep", character, "input")).toBe("keep");
            expect(await service.process("keep", characterWith({}), "display")).toBe("keep");
            expect(getRegexWorker).not.toHaveBeenCalled();
            expect(getScriptingWorker).not.toHaveBeenCalled();
        });

        it("only applies the hooks registered for the requested type", async () => {
            const character = characterWith({
                input: [hook("a", "INPUT")],
                output: [hook("a", "OUTPUT")],
                display: [hook("a", "DISPLAY")],
            });

            expect(await service.process("a", character, "output")).toBe("OUTPUT");
            expect(await service.process("a", character, "display")).toBe("DISPLAY");
        });
    });

    describe("regex hooks", () => {
        it("honours the flags of the hook", async () => {
            const sensitive = characterWith({ input: [hook("cat", "dog", { flag: "g" })] });
            const insensitive = characterWith({ input: [hook("cat", "dog", { flag: "gi" })] });

            expect(await service.process("Cat cat", sensitive, "input")).toBe("Cat dog");
            expect(await service.process("Cat cat", insensitive, "input")).toBe("dog dog");
        });

        it("supports capture groups in the replacement", async () => {
            const character = characterWith({ input: [hook("(\\w+)@(\\w+)", "$2 at $1")] });

            expect(await service.process("me@home", character, "input")).toBe("home at me");
        });

        it("leaves the content unchanged when the pattern is an invalid regex", async () => {
            const character = characterWith({ input: [hook("(unclosed", "x")] });

            expect(await service.process("(unclosed text", character, "input")).toBe(
                "(unclosed text"
            );
        });

        it("runs higher priority hooks first and feeds each result into the next", async () => {
            const character = characterWith({
                input: [
                    hook("b", "c", { priority: 1 }),
                    hook("a", "b", { priority: 10 }),
                    hook("c", "done", { priority: 0 }),
                ],
            });

            // a -> b (10), b -> c (1), c -> done (0)
            expect(await service.process("a", character, "input")).toBe("done");
        });
    });

    describe("string hooks", () => {
        it("matches special characters literally", async () => {
            const character = characterWith({
                input: [hook("1+1=(2)", "two", { type: "string" })],
            });

            expect(await service.process("1+1=(2) and 1111", character, "input")).toBe(
                "two and 1111"
            );
        });

        it("replaces every occurrence", async () => {
            const character = characterWith({
                input: [hook("x", "y", { type: "string", caseSensitive: true })],
            });

            expect(await service.process("x X x", character, "input")).toBe("y X y");
        });
    });

    describe("scripted patterns", () => {
        it("uses the script result as the pattern", async () => {
            const character = characterWith({
                input: [hook("'ap' + 'ple'", "fruit", { scriptedInput: true })],
            });

            expect(await service.process("an apple", character, "input")).toBe("an fruit");
        });

        it("passes message content, role by hook type, persona and permissions to the script", async () => {
            const persona: Persona = apply(PersonaSchema, {
                id: "persona-1",
                name: "Arisu",
                description: "",
                allowLowLevelAccess: true,
            });
            const character = characterWith({
                input: [hook("'x'", "y", { scriptedInput: true })],
                display: [hook("'x'", "y", { scriptedInput: true })],
            });

            await service.process("hello", character, "input", persona);
            await service.process("hello", character, "display");

            expect(execute).toHaveBeenNthCalledWith(1, "'x'", {
                context: {
                    message: { content: "hello", role: "user", metadata: {} },
                    persona: { name: "Arisu", id: "persona-1" },
                },
                allowNetwork: true,
                characterId: "char-hooks",
            });
            expect(execute).toHaveBeenNthCalledWith(2, "'x'", {
                context: {
                    message: { content: "hello", role: "assistant", metadata: {} },
                    persona: undefined,
                },
                allowNetwork: false,
                characterId: "char-hooks",
            });
        });

        it("lets an explicit role override the role implied by the hook type", async () => {
            const character = characterWith({
                output: [hook("'x'", "y", { scriptedInput: true })],
            });

            await service.process("hello", character, "output", undefined, "user");

            expect(execute.mock.calls[0][1]?.context?.message.role).toBe("user");
        });

        it("serializes object results as JSON and other values with String conversion", async () => {
            const character = characterWith({
                input: [
                    hook("({ k: 1 })", "A", { type: "string", scriptedInput: true }),
                    hook("12", "B", { type: "string", scriptedInput: true }),
                    hook("[1, 'two']", "C", { type: "string", scriptedInput: true }),
                ],
            });

            const out = await service.process('{"k":1} 12 [1,"two"]', character, "input");

            expect(out).toBe("A B C");
        });

        it("serializes a bigint result without throwing", async () => {
            execute.mockResolvedValueOnce({ result: 123n, logs: [] });
            const character = characterWith({
                input: [hook("ignored", "N", { type: "string", scriptedInput: true })],
            });

            expect(await service.process("value 123", character, "input")).toBe("value N");
        });

        it("falls back to the literal pattern when the script returns null or nothing", async () => {
            const character = characterWith({
                input: [hook("cat", "dog", { type: "string", scriptedInput: true })],
            });
            execute.mockResolvedValueOnce({ result: null, logs: [] });
            expect(await service.process("a cat", character, "input")).toBe("a dog");

            execute.mockResolvedValueOnce({ result: undefined, logs: [] });
            expect(await service.process("a cat", character, "input")).toBe("a dog");
        });

        it("logs a script error and applies the hook with the literal pattern", async () => {
            const character = characterWith({
                input: [hook("cat", "dog", { type: "string", scriptedInput: true })],
            });
            execute.mockResolvedValueOnce({ error: "SyntaxError: nope", logs: [] });

            const out = await service.process("a cat", character, "input");

            expect(out).toBe("a dog");
            expect(logs).toContainEqual(
                expect.objectContaining({
                    level: "script.hook.error",
                    data: {
                        characterId: "char-hooks",
                        hookType: "input",
                        errorMessage: "SyntaxError: nope",
                    },
                })
            );
            expect(logs.some((e) => e.level === "error")).toBe(true);
        });
    });

    describe("scripted output", () => {
        it("evaluates the replacement script once and uses its result for every regex match", async () => {
            const character = characterWith({
                output: [hook("\\d+", "'#' + 'N'", { scriptedOutput: true })],
            });

            expect(await service.process("1 and 22 and 333", character, "output")).toBe(
                "#N and #N and #N"
            );
            expect(execute).toHaveBeenCalledTimes(1);
        });

        it("converts non-string script results for regex hooks", async () => {
            const character = characterWith({
                output: [hook("count", "6 * 7", { scriptedOutput: true })],
            });

            expect(await service.process("count", character, "output")).toBe("42");
        });

        it("converts object results to JSON for string hooks", async () => {
            const character = characterWith({
                display: [hook("data", "({ ok: true })", { type: "string", scriptedOutput: true })],
            });

            expect(await service.process("data", character, "display")).toBe('{"ok":true}');
        });

        it("keeps the raw replacement text when the script yields null or undefined", async () => {
            const regexHook = characterWith({
                output: [hook("a", "raw-regex", { scriptedOutput: true })],
            });
            const stringHook = characterWith({
                output: [hook("a", "raw-string", { type: "string", scriptedOutput: true })],
            });
            execute.mockResolvedValue({ result: null, logs: [] });

            expect(await service.process("a", regexHook, "output")).toBe("raw-regex");
            expect(await service.process("a", stringHook, "output")).toBe("raw-string");
        });

        it("turns an unserializable result (function) into an empty replacement", async () => {
            execute.mockResolvedValueOnce({ result: () => 1, logs: [] });
            const character = characterWith({
                output: [hook("a", "x", { scriptedOutput: true })],
            });

            expect(await service.process("[a]", character, "output")).toBe("[]");
        });

        it("does not throw on a circular result and keeps processing", async () => {
            const circular: Record<string, unknown> = {};
            circular.self = circular;
            execute.mockResolvedValueOnce({ result: circular, logs: [] });
            const character = characterWith({
                output: [hook("a", "x", { scriptedOutput: true })],
            });

            await expect(service.process("[a]", character, "output")).resolves.toMatch(/^\[.+\]$/);
        });
    });

    describe("with the real scripting worker", () => {
        beforeEach(() => {
            vi.mocked(getScriptingWorker).mockResolvedValue(
                mockScriptingWorker(scriptingApi.execute)
            );
        });

        it("evaluates a scripted pattern and a scripted replacement in the sandbox", async () => {
            const character = characterWith({
                input: [hook("'ap' + 'ple'", "fruit", { scriptedInput: true })],
                output: [hook("[0-9]+", "'#' + (6 * 7)", { scriptedOutput: true })],
            });

            expect(await service.process("an apple", character, "input")).toBe("an fruit");
            expect(await service.process("n=1", character, "output")).toBe("n=#42");
        });

        it("hands the message and the persona to the script", async () => {
            const persona: Persona = apply(PersonaSchema, {
                id: "persona-1",
                name: "아리스",
                description: "",
            });
            const character = characterWith({
                input: [
                    hook("context.message.role + '/' + context.persona.name", "hit", {
                        scriptedInput: true,
                    }),
                ],
            });

            expect(await service.process("user/아리스", character, "input", persona)).toBe("hit");
        });

        it("logs a script error and applies the hook with the literal pattern", async () => {
            const character = characterWith({
                input: [hook("cat", "dog", { type: "string", scriptedInput: true })],
            });

            expect(await service.process("a cat", character, "input")).toBe("a dog");
            expect(logs.some((e) => e.level === "script.hook.error")).toBe(true);
        });
    });

    describe("telemetry", () => {
        it("emits start and complete events per hook with type and character id", async () => {
            const character = characterWith({
                input: [hook("a", "b"), hook("b", "c")],
            });

            await service.process("a", character, "input");

            const events = logs.filter((e) => e.level.startsWith("script.hook."));
            expect(events.map((e) => e.level)).toEqual([
                "script.hook.start",
                "script.hook.complete",
                "script.hook.start",
                "script.hook.complete",
            ]);
            expect(events[0].data).toEqual({ characterId: "char-hooks", hookType: "input" });
            expect(events[1].data).toMatchObject({
                characterId: "char-hooks",
                hookType: "input",
            });
            expect(events[1].data).toHaveProperty("durationMs", expect.any(Number));
        });
    });
});
