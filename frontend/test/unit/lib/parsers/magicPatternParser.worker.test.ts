// @vitest-environment jsdom
/**
 * @fileoverview Magic patterns evaluated by the real scripting worker (QuickJS through
 * define-function), called directly as `test/workers/scripting.test.ts` does. Only the Comlink
 * wrapper and the worker getter are replaced, so the generated source runs in the real sandbox.
 */
import { describe, it, expect, vi } from "vitest";
import { parseMagicPatterns, type MagicPatternContext } from "@/lib/parsers/magicPatternParser";
import { exampleCharacter } from "@/const/example_data";
import { mockScriptingWorker } from "@test/utils/mockWorkerApi";
import { makeMessage } from "@test/utils/message";

vi.mock("comlink", () => ({ expose: vi.fn() }));
// The getter hands out the real worker api, so no test has to configure a shared mock.
vi.mock("@/lib/workers/workerClient", async () => {
    const { api } = await import("@worker/scripting/main");
    return { getScriptingWorker: async () => mockScriptingWorker(api.execute) };
});

const history = [
    makeMessage("m1", "안녕하세요", { role: "user", timestamp: 1 }),
    makeMessage("m2", "반가워요", { role: "assistant", timestamp: 2 }),
];

function makeContext(overrides: Partial<MagicPatternContext> = {}): MagicPatternContext {
    return {
        character: { ...exampleCharacter, id: "char-worker", name: "아넬라" },
        persona: { name: "아리스", description: "호기심 많은 사용자" },
        chat: (a, b) => (a < 0 && b >= 0 ? history : []),
        ...overrides,
    };
}

// Not concurrent: overlapping `execute` calls of the real worker leak results into each other (a thrown
// error showed up in the output of another test), so these tests must run one after another.
describe("parseMagicPatterns through the real scripting worker", () => {
    it("exposes character, persona and the newest message to the pattern", async () => {
        const out = await parseMagicPatterns(
            "{| return character.name + '/' + persona.name + '/' + chat(0, 0)[0].content |}",
            makeContext()
        );

        expect(out).toBe("아넬라/아리스/반가워요");
    });

    it("keeps a pattern whose script throws and still evaluates the others", async () => {
        const out = await parseMagicPatterns(
            "{| throw new Error('boom') |} {| return 'after' |}",
            makeContext()
        );

        expect(out).toBe("{| throw new Error('boom') |} after");
    });

    it("keeps hostile character data as data inside the sandbox", async () => {
        const name = "따옴표\" 작은'따옴표 `백틱` 줄\n바꿈\u2028\u2029\\ </script>";

        const out = await parseMagicPatterns(
            "{| return character.name |}",
            makeContext({ character: { ...exampleCharacter, id: "char-worker", name } })
        );

        expect(out).toBe(name);
    });
});
