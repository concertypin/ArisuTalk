/**
 * Magic pattern tests that run the generated sandbox source for real.
 *
 * The scripting worker (QuickJS in a Web Worker) is the only mocked boundary. Its `execute` is
 * replaced with a Node `vm` runner that evaluates the exact source string the parser sends, so
 * `character`, `persona` and `chat()` inside the sandbox are the parser's own code.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { parseMagicPatterns, type MagicPatternContext } from "@/lib/parsers/magicPatternParser";
import { getScriptingWorker } from "@/lib/workers/workerClient";
import { exampleCharacter } from "@/const/example_data";
import { mockScriptingWorker, runInVm } from "@test/utils/mockWorkerApi";
import { makeMessage } from "@test/utils/message";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

vi.mock("@/lib/workers/workerClient", () => ({
    getScriptingWorker: vi.fn(),
}));

/** Oldest first, like chat history in storage: m1 is the oldest, m4 the newest. */
const history: Message[] = [
    makeMessage("m1", "one", { role: "user", timestamp: 1 }),
    makeMessage("m2", "two", { role: "assistant", timestamp: 2 }),
    makeMessage("m3", "three", { role: "user", timestamp: 3 }),
    makeMessage("m4", "four", { role: "assistant", timestamp: 4 }),
];

function makeContext(overrides: Partial<MagicPatternContext> = {}): MagicPatternContext {
    return {
        character: { ...exampleCharacter, id: "char-ctx", name: "Anella" },
        persona: { name: "Arisu", description: "A curious user" },
        chat: () => history,
        ...overrides,
    };
}

describe("parseMagicPatterns with the generated sandbox code", () => {
    let logs: AnyLogEntry[];
    let detach: () => void;
    const execute = vi.fn(runInVm);

    beforeEach(() => {
        execute.mockClear();
        vi.mocked(getScriptingWorker).mockResolvedValue(mockScriptingWorker(execute));
        logs = [];
        detach = Logger.onLog((entry) => logs.push(entry));
    });

    afterEach(() => {
        detach();
        vi.resetAllMocks();
    });

    const errors = () =>
        logs.filter((entry) => entry.level === "error").map((entry) => entry.message);

    describe("context variables", () => {
        it("exposes character and persona to the pattern", async () => {
            const out = await parseMagicPatterns(
                "Hi {| return character.name + ' meets ' + persona.name + ' (' + persona.description + ')' |}!",
                makeContext()
            );

            expect(out).toBe("Hi Anella meets Arisu (A curious user)!");
        });

        it("sends the character id and a timeout with every execution", async () => {
            await parseMagicPatterns("{| return 1 |}", makeContext());

            expect(execute).toHaveBeenCalledWith(expect.any(String), {
                characterId: "char-ctx",
                timeout: 5000,
            });
        });

        it("snapshots message id, role, text and timestamp for chat()", async () => {
            const out = await parseMagicPatterns("{| return chat(0, 0) |}", makeContext());

            expect(JSON.parse(out)).toEqual([
                { id: "m4", role: "assistant", content: "four", timestamp: 4 },
            ]);
        });

        it("turns non-text message content into an empty string in the snapshot", async () => {
            const imageMessage: Message = {
                ...makeMessage("img", "ignored", { role: "user", timestamp: 9 }),
                content: { type: "file", data: new Uint8Array([1, 2, 3]), mimeType: "image/png" },
            };

            const out = await parseMagicPatterns(
                "{| return chat(0, 0)[0].content === '' |}",
                makeContext({ chat: () => [imageMessage] })
            );

            expect(out).toBe("true");
        });
    });

    describe("chat(a, b) indexing", () => {
        const texts = async (call: string) => {
            const out = await parseMagicPatterns(
                `{| return ${call}.map(m => m.content) |}`,
                makeContext()
            );
            const parsed: unknown = JSON.parse(out);
            return parsed;
        };

        it("0 is the newest message and ranges are inclusive", async () => {
            expect(await texts("chat(0, 1)")).toEqual(["four", "three"]);
        });

        it("a greater than b returns the range in reverse order", async () => {
            expect(await texts("chat(1, 0)")).toEqual(["three", "four"]);
        });

        it("-1 is the oldest message and -2 the second oldest", async () => {
            expect(await texts("chat(-1, -1)")).toEqual(["one"]);
            expect(await texts("chat(-1, -2)")).toEqual(["one", "two"]);
        });

        it("mixes positive and negative indexes from newest to oldest", async () => {
            expect(await texts("chat(0, -1)")).toEqual(["four", "three", "two", "one"]);
        });

        it("chat(-1, 0) is the whole history in chronological order", async () => {
            expect(await texts("chat(-1, 0)")).toEqual(["one", "two", "three", "four"]);
        });

        it("clamps out-of-range indexes to the available history", async () => {
            expect(await texts("chat(0, 100)")).toEqual(["four", "three", "two", "one"]);
            expect(await texts("chat(100, 0)")).toEqual(["one", "two", "three", "four"]);
            expect(await texts("chat(50, 60)")).toEqual(["one"]);
        });

        it("returns an empty list when there is no history", async () => {
            const out = await parseMagicPatterns(
                "{| return chat(0, 5).length |}",
                makeContext({ chat: () => [] })
            );

            expect(out).toBe("0");
        });
    });

    describe("result formatting", () => {
        it.each([
            ["a number", "return 6 * 7", "42"],
            ["a boolean", "return 1 < 2", "true"],
            ["an object as JSON", "return { a: 1, b: [2, 3] }", '{"a":1,"b":[2,3]}'],
            ["an array as JSON", "return ['x', 'y']", '["x","y"]'],
            ["a missing return as an empty string", "const unused = 1", ""],
        ])("renders %s", async (_label, code, expected) => {
            expect(await parseMagicPatterns(`[{| ${code} |}]`, makeContext())).toBe(
                `[${expected}]`
            );
        });

        it("replaces several patterns in order and keeps the surrounding text", async () => {
            const out = await parseMagicPatterns(
                "A{| return 1 |}B{| return 2 |}C {| return 'three' |}",
                makeContext()
            );

            expect(out).toBe("A1B2C three");
        });

        it("supports multi-line pattern code", async () => {
            const out = await parseMagicPatterns(
                "{|\n  const names = ['a', 'b'];\n  return names.join('+');\n|}",
                makeContext()
            );

            expect(out).toBe("a+b");
        });

        it("returns text without patterns untouched and never asks for a worker", async () => {
            const out = await parseMagicPatterns("no patterns | here {", makeContext());

            expect(out).toBe("no patterns | here {");
            expect(getScriptingWorker).not.toHaveBeenCalled();
        });
    });

    describe("failures keep the original pattern text", () => {
        it("keeps a pattern whose script throws, still evaluates the others, and logs the error", async () => {
            const out = await parseMagicPatterns(
                "{| return 'ok' |} {| throw new Error('boom') |} {| return 'after' |}",
                makeContext()
            );

            expect(out).toBe("ok {| throw new Error('boom') |} after");
            expect(errors().some((message) => message.includes("boom"))).toBe(true);
        });

        it("keeps the pattern when the worker call itself rejects", async () => {
            execute.mockRejectedValueOnce(new Error("worker crashed"));

            const out = await parseMagicPatterns("x {| return 1 |} y", makeContext());

            expect(out).toBe("x {| return 1 |} y");
            expect(errors().some((message) => message.includes("worker crashed"))).toBe(true);
        });

        it("returns the text unchanged and logs when the worker cannot be created", async () => {
            vi.mocked(getScriptingWorker).mockRejectedValue(new Error("no worker support"));

            const out = await parseMagicPatterns("{| return 1 |} text", makeContext());

            expect(out).toBe("{| return 1 |} text");
            expect(execute).not.toHaveBeenCalled();
            expect(errors().some((message) => message.includes("no worker support"))).toBe(true);
        });

        it("keeps an empty pattern as is without running anything", async () => {
            const out = await parseMagicPatterns("a{|   |}b{| return 2 |}", makeContext());

            expect(out).toBe("a{|   |}b2");
            expect(execute).toHaveBeenCalledTimes(1);
        });
    });
});
