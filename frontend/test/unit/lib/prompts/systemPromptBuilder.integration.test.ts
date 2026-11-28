/**
 * System prompt assembly with the real magic pattern parser.
 *
 * Only the scripting worker is replaced (by `runInVm`, a Node `vm` stand-in for QuickJS), so the
 * builder's wiring of `character`, `persona` and the chat history into the pattern scripts is
 * exercised end to end.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { buildSystemPrompt } from "@/lib/prompts/systemPromptBuilder";
import { getScriptingWorker } from "@/lib/workers/workerClient";
import { mockScriptingWorker, runInVm } from "@test/utils/mockWorkerApi";
import { createTestCharacter } from "@test/utils/character";
import { makeMessage } from "@test/utils/message";
import type { Character } from "@arisutalk/character-spec/v0/Character";

vi.mock("@/lib/workers/workerClient", () => ({
    getScriptingWorker: vi.fn(),
}));

type LoreEntry = NonNullable<Character["prompt"]["lorebook"]>["data"][number];

function lore(
    id: string,
    content: string,
    overrides: Partial<Pick<LoreEntry, "enabled" | "condition">> = {}
): LoreEntry {
    return {
        id,
        name: id,
        content,
        priority: 0,
        enabled: true,
        multipleConditionResolveStrategy: "any",
        condition: [{ type: "always" }],
        ...overrides,
    };
}

/** The fixture character with the given system description and lorebook entries. */
function characterWithPrompt(description: string, loreEntries: LoreEntry[] = []): Character {
    return createTestCharacter({
        name: "Arisu",
        description: "A maid",
        prompt: { description, lorebook: { config: {}, data: loreEntries } },
    });
}

describe("buildSystemPrompt with magic patterns", () => {
    let logs: AnyLogEntry[];
    let detach: () => void;

    beforeEach(() => {
        vi.mocked(getScriptingWorker).mockResolvedValue(mockScriptingWorker(vi.fn(runInVm)));
        logs = [];
        detach = Logger.onLog((entry) => logs.push(entry));
    });

    afterEach(() => {
        detach();
        vi.resetAllMocks();
    });

    describe("pattern context", () => {
        it("resolves persona and character values inside the system section", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt:
                    "Talk to {| return persona.name |} as {| return character.name |}.",
                character: characterWithPrompt(""),
                persona: { name: "Arisu-chan", description: "" },
            });

            expect(prompt).toBe("[System Prompt]\nTalk to Arisu-chan as Arisu.");
        });

        it("exposes the chat history passed to the builder through chat()", async () => {
            const history = [
                makeMessage("m1", "first", { timestamp: 1 }),
                makeMessage("m2", "latest", { timestamp: 2 }),
            ];

            const prompt = await buildSystemPrompt(
                {
                    generationPrompt: "Last: {| return chat(0, 0)[0].content |}",
                    character: characterWithPrompt(""),
                    persona: null,
                },
                undefined,
                history
            );

            expect(prompt).toBe("[System Prompt]\nLast: latest");
        });

        it("gives chat() an empty history when none is passed", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "Count: {| return chat(0, 10).length |}",
                character: characterWithPrompt(""),
                persona: null,
            });

            expect(prompt).toBe("[System Prompt]\nCount: 0");
        });

        it("names the persona 'User' when no persona is set", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "Hello {| return persona.name |}",
                character: characterWithPrompt(""),
                persona: null,
            });

            expect(prompt).toBe("[System Prompt]\nHello User");
        });

        it("passes the persona description to patterns in other sections", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "",
                character: characterWithPrompt("Persona is: {| return persona.description |}"),
                persona: { name: "P", description: "curious" },
            });

            expect(prompt).toBe(
                "[Character Persona]\nPersona is: curious\n\n[User Persona]\ncurious"
            );
        });

        it("keeps the pattern text and still builds the prompt when the pattern throws", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "A {| return missing.value |} B",
                character: characterWithPrompt("Plain"),
                persona: null,
            });

            expect(prompt).toBe(
                "[System Prompt]\nA {| return missing.value |} B\n\n[Character Persona]\nPlain"
            );
        });

        it("builds the prompt without evaluating anything when no section has patterns", async () => {
            await buildSystemPrompt({
                generationPrompt: "plain",
                character: characterWithPrompt("plain too"),
                persona: null,
            });

            expect(getScriptingWorker).not.toHaveBeenCalled();
        });
    });

    describe("section ordering and filtering", () => {
        const ctx = {
            generationPrompt: "SYS",
            character: characterWithPrompt("CHAR", [lore("l1", "LORE")]),
            persona: { name: "P", description: "PERSONA" },
        };

        it("emits sections in the canonical order with labeled headers", async () => {
            expect(await buildSystemPrompt(ctx)).toBe(
                "[System Prompt]\nSYS\n\n[Character Persona]\nCHAR\n\n[User Persona]\nPERSONA\n\n[Lore]\nLORE"
            );
        });

        it("places sections missing from the overrides after the configured ones, in canonical order", async () => {
            const prompt = await buildSystemPrompt(ctx, [{ key: "lore", enabled: true }]);

            expect(prompt).toBe(
                "[Lore]\nLORE\n\n[System Prompt]\nSYS\n\n[Character Persona]\nCHAR\n\n[User Persona]\nPERSONA"
            );
        });

        it("does not re-add a section that the overrides explicitly disabled", async () => {
            const prompt = await buildSystemPrompt(ctx, [{ key: "system", enabled: false }]);

            expect(prompt).toBe(
                "[Character Persona]\nCHAR\n\n[User Persona]\nPERSONA\n\n[Lore]\nLORE"
            );
        });

        it("treats an empty override list like no overrides", async () => {
            expect(await buildSystemPrompt(ctx, [])).toBe(await buildSystemPrompt(ctx));
        });

        it("trims section text and skips whitespace-only sections", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "   padded   ",
                character: characterWithPrompt("   "),
                persona: { name: "P", description: "\n\t" },
            });

            expect(prompt).toBe("[System Prompt]\npadded");
        });
    });

    describe("lore section", () => {
        it("joins enabled always-on entries with a blank line", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "",
                character: characterWithPrompt("", [
                    lore("a", "first fact"),
                    lore("b", "second fact"),
                ]),
                persona: null,
            });

            expect(prompt).toBe("[Lore]\nfirst fact\n\nsecond fact");
        });

        it("skips disabled entries and entries that are not always-on", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "",
                character: characterWithPrompt("", [
                    lore("off", "disabled", { enabled: false }),
                    lore("kw", "keyword only", {
                        condition: [{ type: "plain_text_match", text: "tea" }],
                    }),
                    lore("on", "kept"),
                ]),
                persona: null,
            });

            expect(prompt).toBe("[Lore]\nkept");
        });

        it("produces no prompt when every lore entry is filtered out", async () => {
            const prompt = await buildSystemPrompt({
                generationPrompt: "",
                character: characterWithPrompt("", [lore("off", "disabled", { enabled: false })]),
                persona: null,
            });

            expect(prompt).toBeNull();
        });

        it("logs how many sections were assembled", async () => {
            await buildSystemPrompt({
                generationPrompt: "SYS",
                character: characterWithPrompt("CHAR"),
                persona: null,
            });

            expect(
                logs.some(
                    (entry) =>
                        entry.level === "info" &&
                        entry.message.includes("Assembled 2 sections (system, character)")
                )
            ).toBe(true);
        });
    });
});
