/**
 * Magic pattern tests that run the generated sandbox source for real.
 *
 * The scripting worker (QuickJS in a Web Worker) is the only mocked boundary. Its `execute` is
 * replaced with a Node `vm` runner that evaluates the exact source string the parser sends, so
 * `character`, `persona` and `chat()` inside the sandbox are the parser's own code.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    const execute = vi.fn(runInVm);

    beforeEach(() => {
        execute.mockClear();
        vi.mocked(getScriptingWorker).mockResolvedValue(mockScriptingWorker(execute));
    });

    afterEach(() => {
        vi.resetAllMocks();
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
});
