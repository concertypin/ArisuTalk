/**
 * @fileoverview Magic Pattern Parser placeholder.
 * Magic patterns are special syntax in prompts: {| javascript code |}
 * Actual implementation will use QuickJS in a future task.
 */

import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

/**
 * Context provided to magic pattern scripts.
 */
export interface MagicPatternContext {
    /** The character being chatted with. */
    character: Character;
    /** The user's persona. */
    persona: {
        name: string;
        description?: string;
    };
    /**
     * Access chat history.
     * @param a - Start index (0 = newest, -1 = oldest)
     * @param b - End index (inclusive)
     * @returns Array of messages in the specified range.
     */
    chat: (a: number, b: number) => Message[];
}

/**
 * Parses and executes magic patterns in text.
 *
 * Magic patterns use the syntax: {| javascript code |}
 * The code must use `return` to output a value.
 *
 * @param text - The text containing magic patterns.
 * @param _context - Context available to pattern scripts (unused in placeholder).
 * @returns The text with patterns replaced. Currently returns input unchanged.
 *
 * @example
 * // Future usage:
 * const result = await parseMagicPatterns(
 *   "Hello {| return character.name |}!",
 *   { character, persona, chat }
 * );
 */
export async function parseMagicPatterns(
    text: string,
    _context: MagicPatternContext
): Promise<string> {
    // Check if there are any magic patterns
    const PATTERN_REGEX = /\{\|[\s\S]*?\|\}/;

    if (PATTERN_REGEX.test(text)) {
        console.error(
            "[MagicPattern] Parser not implemented yet. " +
                "Magic patterns will be displayed as-is. " +
                "QuickJS integration pending."
        );
    }

    // Placeholder: return text unchanged
    return text;
}

export default parseMagicPatterns;
