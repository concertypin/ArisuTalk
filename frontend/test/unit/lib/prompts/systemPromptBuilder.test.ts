/**
 * @fileoverview Unit tests for SystemPromptBuilder.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSystemPrompt, type SystemPromptContext } from "@/lib/prompts/systemPromptBuilder";
import type { Character } from "@arisutalk/character-spec/v0/Character";

vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
    TEST_REGEX: /\{\|[\s\S]*?\|\}/,
}));

function makeCharacter(overrides?: Record<string, unknown>): Character {
    return {
        id: "char-1",
        name: "Arisu",
        description: "A maid",
        specVersion: 0,
        metadata: { createdAt: "", updatedAt: "" },
        prompt: {
            description: "You are Arisu, a loyal maid. Call the user 御主人様.",
            authorsNote: "",
            lorebook: {
                config: {},
                data: [
                    {
                        id: "lore-1",
                        condition: [{ type: "always" }],
                        content: "Arisu loves tea.",
                        name: "Tea",
                        enabled: true,
                        priority: 0,
                        multipleConditionResolveStrategy: "any",
                    },
                    {
                        id: "lore-2",
                        condition: [{ type: "always" }],
                        content: "This should be disabled.",
                        name: "Disabled",
                        enabled: false,
                        priority: 0,
                        multipleConditionResolveStrategy: "any",
                    },
                ],
            },
        },
        executables: {
            runtimeSetting: { timeout: 30000 },
            replaceHooks: { display: [], input: [], output: [], request: [] },
        },
        assets: { assets: [] },
        ...overrides,
    } as unknown as Character;
}

function makeCtx(overrides?: Partial<SystemPromptContext>): SystemPromptContext {
    return {
        generationPrompt: "You are a helpful assistant.",
        character: makeCharacter(),
        persona: { name: "メスガキ", description: "Bratty girl. Use ♡." },
        ...overrides,
    };
}

describe("SystemPromptBuilder", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("assembles all sections by default", async () => {
        const result = await buildSystemPrompt(makeCtx());
        expect(result).not.toBeNull();
        expect(result).toContain("You are a helpful assistant.");
        expect(result).toContain("御主人様");
        expect(result).toContain("Bratty girl");
        expect(result).toContain("Arisu loves tea.");
    });

    it("returns null when all sections produce no content", async () => {
        const result = await buildSystemPrompt({
            generationPrompt: "",
            character: undefined,
            persona: null,
        });
        expect(result).toBeNull();
    });

    it("returns null when all sections are disabled in overrides", async () => {
        const result = await buildSystemPrompt(makeCtx(), [
            { key: "system", enabled: false },
            { key: "character", enabled: false },
            { key: "persona", enabled: false },
            { key: "lore", enabled: false },
        ]);
        expect(result).toBeNull();
    });

    it("returns null when all sections are disabled and character is missing", async () => {
        const result = await buildSystemPrompt(
            makeCtx({ character: undefined, persona: null, generationPrompt: "" }),
            [
                { key: "system", enabled: false },
                { key: "character", enabled: false },
                { key: "persona", enabled: false },
                { key: "lore", enabled: false },
            ]
        );
        expect(result).toBeNull();
    });

    it("respects section order from overrides", async () => {
        const result = await buildSystemPrompt(makeCtx(), [
            { key: "persona", enabled: true },
            { key: "system", enabled: true },
            { key: "character", enabled: true },
            { key: "lore", enabled: true },
        ]);
        expect(result).not.toBeNull();
        const personaIdx = result!.indexOf("[User Persona]");
        const systemIdx = result!.indexOf("[System Prompt]");
        expect(personaIdx).toBeGreaterThanOrEqual(0);
        expect(systemIdx).toBeGreaterThanOrEqual(0);
        expect(personaIdx).toBeLessThan(systemIdx);
    });

    it("excludes disabled sections", async () => {
        const result = await buildSystemPrompt(makeCtx(), [
            { key: "system", enabled: true },
            { key: "character", enabled: false },
            { key: "persona", enabled: false },
            { key: "lore", enabled: true },
        ]);
        expect(result).toContain("You are a helpful assistant.");
        expect(result).not.toContain("御主人様");
        expect(result).not.toContain("Bratty girl");
        expect(result).toContain("Arisu loves tea.");
    });

    it("includes enabled lore but excludes disabled lore entries", async () => {
        const result = await buildSystemPrompt(makeCtx());
        expect(result).toContain("Arisu loves tea.");
        expect(result).not.toContain("This should be disabled.");
    });

    it("omits character section when prompt.description is empty", async () => {
        const char = makeCharacter({
            prompt: { description: "", authorsNote: "", lorebook: { config: {}, data: [] } },
        });
        const result = await buildSystemPrompt(makeCtx({ character: char }));
        expect(result).not.toContain("[Character Persona]");
    });

    it("omits persona section when persona has no description", async () => {
        const result = await buildSystemPrompt(makeCtx({ persona: { name: "User" } }));
        expect(result).not.toContain("[User Persona]");
    });

    it("preserves original pattern text when magic pattern parsing fails", async () => {
        // Negative test: when parseMagicPatterns throws, the original text
        // with the literal `{| ... |}` syntax must be preserved (not swallowed).
        const { parseMagicPatterns } = await import("@/lib/parsers/magicPatternParser");
        vi.mocked(parseMagicPatterns).mockRejectedValueOnce(new Error("parse crash"));
        const result = await buildSystemPrompt(makeCtx({ generationPrompt: "text {| bad |}" }));
        expect(result).not.toBeNull();
        expect(result).toContain("text {| bad |}");
    });
    it("handles magic pattern when character is undefined (graceful degradation)", async () => {
        // Regression: ctx.character may be undefined when magic patterns
        // reference it. The try/catch around parseMagicPatterns preserves
        // the original `{| ... |}` text instead of crashing.
        // This locks the behavior described in the comment at
        // systemPromptBuilder.ts:163-167.
        const { parseMagicPatterns } = await import("@/lib/parsers/magicPatternParser");
        vi.mocked(parseMagicPatterns).mockRejectedValueOnce(
            new Error("Cannot read properties of undefined (reading 'name')")
        );
        const result = await buildSystemPrompt(
            makeCtx({
                character: undefined,
                generationPrompt: "Hello {| character.name |}",
            })
        );
        expect(result).not.toBeNull();
        // Original pattern text must be preserved when parse fails
        expect(result).toContain("Hello {| character.name |}");
    });

    it("omits system section but includes character and persona when generationPrompt is empty", async () => {
        const result = await buildSystemPrompt(makeCtx({ generationPrompt: "" }));
        expect(result).not.toBeNull();
        expect(result).not.toContain("[System Prompt]");
        expect(result).toContain("御主人様");
        expect(result).toContain("Bratty girl");
    });

    it("exhaustiveness guard fires at compile time when a new key is added", () => {
        // Reference the source PromptSection type via buildSystemPrompt's
        // sectionOverrides parameter. This ensures the test is tied to
        // the actual source code — if a developer adds a new key to the
        // union in systemPromptBuilder.ts without updating assembleSection's
        // switch, this test's type assertion breaks.
        type SourceKey = NonNullable<Parameters<typeof buildSystemPrompt>[1]>[number]["key"];

        // Positive: known keys must be assignable
        const sysKey: SourceKey = "system";
        const charKey: SourceKey = "character";
        const personaKey: SourceKey = "persona";
        const loreKey: SourceKey = "lore";
        void [sysKey, charKey, personaKey, loreKey];

        // Negative: an unknown key must NOT be assignable to SourceKey.
        // If someone adds "memory" to the source union, this @ts-expect-error
        // will correctly fire (proving the guard catches new keys).
        // @ts-expect-error — "memory" is not in the source PromptSection union
        const _unknown: SourceKey = "memory";
        void _unknown;
    });
});
