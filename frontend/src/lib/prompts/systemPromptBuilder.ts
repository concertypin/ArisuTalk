/**
 * @fileoverview System Prompt Builder.
 *
 * Assembles the system prompt from configurable sections:
 *   1. `system`    — base generation prompt from settings
 *   2. `character` — character persona (prompt.description)
 *   3. `persona`   — user persona (persona.description)
 *   4. `lore`      — active lorebook entries
 *
 * Section order and enabled/disabled state are controlled by
 * `settings.prompt.promptSections`. Missing sections default to enabled
 * and appear in the canonical order above.
 *
 * Supports magic pattern syntax (`{| ... |}`) in the generation prompt.
 * Magic patterns are parsed at assembly time with access to character,
 * persona, and chat history context.
 */

import type { Character } from "@arisutalk/character-spec/v0/Character";
import { Logger } from "@common/logger/Logger";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { parseMagicPatterns } from "@/lib/parsers/magicPatternParser";

/** Regex matching the opening of a magic pattern (for quick pre-check). */
const MAGIC_PATTERN_REGEX = /\{\|[\s\S]*?\|\}/;

/** Context needed to assemble the system prompt. */
export interface SystemPromptContext {
    /** Base system prompt from settings. */
    generationPrompt: string;
    /** Active character (may be undefined for non-character chats). */
    character?: Character;
    /** Active user persona. */
    persona?: { name: string; description?: string } | null;
}

/** A resolved prompt section with its key and assembled text. */
interface PromptSection {
    key: "system" | "character" | "persona" | "lore";
    content: string;
}

/** Canonical section order. */
const SECTION_ORDER: PromptSection["key"][] = ["system", "character", "persona", "lore"];

/** Section labels for logging. */
const SECTION_LABELS: Record<PromptSection["key"], string> = {
    system: "System Prompt",
    character: "Character Persona",
    persona: "User Persona",
    lore: "Lore",
};

/**
 * Resolves which sections are enabled and their order.
 *
 * @param overrides - User-configured section overrides from settings.
 *                    Entries not present default to enabled, appearing
 *                    in canonical order.
 * @returns Ordered array of enabled section keys.
 */
function resolveSectionOrder(
    overrides?: Array<{ key: PromptSection["key"]; enabled: boolean }>
): PromptSection["key"][] {
    if (!overrides || overrides.length === 0) {
        return [...SECTION_ORDER];
    }

    // Build a map of overrides
    const overrideMap = new Map(overrides.map((o) => [o.key, o.enabled]));

    // Start with sections from overrides (preserving their order)
    const result: PromptSection["key"][] = [];
    for (const section of overrides) {
        if (section.enabled) {
            result.push(section.key);
        }
    }

    // Append any sections not in overrides (default: enabled)
    for (const key of SECTION_ORDER) {
        if (!overrideMap.has(key) && !result.includes(key)) {
            result.push(key);
        }
    }

    return result;
}

/**
 * Assembles a single prompt section from context.
 */
function assembleSection(key: PromptSection["key"], ctx: SystemPromptContext): string | null {
    switch (key) {
        case "system": {
            const prompt = ctx.generationPrompt?.trim();
            return prompt || null;
        }
        case "character": {
            const desc = ctx.character?.prompt?.description?.trim();
            if (!desc) return null;
            return desc;
        }
        case "persona": {
            const desc = ctx.persona?.description?.trim();
            if (!desc) return null;
            return desc;
        }
        case "lore": {
            const parts: string[] = [];

            // Character-level lorebook entries (always-on)
            const charLore = ctx.character?.prompt?.lorebook?.data;
            if (charLore) {
                for (const entry of charLore) {
                    if (entry.enabled === false) continue;
                    // Only include "always" type entries in system prompt
                    const isAlways = entry.condition?.some((c) => c.type === "always");
                    if (isAlways) {
                        parts.push(entry.content);
                    }
                }
            }

            return parts.length > 0 ? parts.join("\n\n") : null;
        }
    }
    // Exhaustiveness check — add new section keys above and update this line
    const _exhaustive: never = key;
    void _exhaustive;
    return null;
}

/**
 * Assembles the full system prompt from all enabled sections.
 *
 * Returns `null` if no sections produce content (caller should skip
 * the SystemMessage entirely).
 *
 * Magic pattern syntax (`{| ... |}`) in any section is executed in a
 * sandboxed context with access to `character`, `persona`, and `chat`.
 *
 * @param ctx - Context with all prompt sources.
 * @param sectionOverrides - User-configured section order/enable state.
 * @param chatHistory - Chat message history for magic pattern `chat()` calls.
 */
export async function buildSystemPrompt(
    ctx: SystemPromptContext,
    sectionOverrides?: Array<{ key: PromptSection["key"]; enabled: boolean }>,
    chatHistory?: Message[]
): Promise<string | null> {
    const enabledSections = resolveSectionOrder(sectionOverrides);

    const sections: PromptSection[] = [];
    for (const key of enabledSections) {
        let content = assembleSection(key, ctx);
        if (content) {
            // Parse magic patterns if present
            if (MAGIC_PATTERN_REGEX.test(content)) {
                try {
                    content = await parseMagicPatterns(content, {
                        // ctx.character may be undefined at runtime.
                        // Patterns that reference `character.*` will throw and
                        // be caught below — the original `{| ... |}` text is
                        // preserved as a graceful fallback.
                        character: ctx.character!,
                        persona: {
                            name: ctx.persona?.name ?? "User",
                            description: ctx.persona?.description,
                        },
                        chat: (_a: number, _b: number) => chatHistory ?? [],
                    });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    Logger.warn(
                        `[SystemPromptBuilder] Magic pattern error in section "${key}": ${msg}`
                    );
                }
            }
            sections.push({ key, content });
        }
    }

    if (sections.length === 0) return null;

    const assembled = sections.map((s) => `[${SECTION_LABELS[s.key]}]\n${s.content}`).join("\n\n");

    Logger.info(
        `[SystemPromptBuilder] Assembled ${sections.length} sections (${sections.map((s) => s.key).join(", ")}) → ${assembled.length} chars`
    );

    return assembled;
}
