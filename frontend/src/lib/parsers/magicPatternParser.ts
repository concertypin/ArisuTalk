/**
 * @fileoverview Magic Pattern Parser.
 *
 * Magic patterns are embeddable JavaScript expressions inside prompt text
 * using the syntax: {| javascript code |}
 *
 * Execution runs in the QuickJS sandbox via the scripting worker, providing
 * safe isolation while giving access to `character`, `persona`, and `chat`
 * context variables inside pattern code.
 *
 * @example
 * ```typescript
 * const result = await parseMagicPatterns(
 *   "Hello {| return character.name |}!",
 *   { character, persona, chat }
 * );
 * // Returns "Hello CharacterName!"
 * ```
 */

import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { Logger } from "@common/logger/Logger";
import { getScriptingWorker } from "@/lib/workers/workerClient";

/**
 * Context provided to magic pattern scripts.
 */
export type MagicPatternContext = {
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
};

/**
 * A JSON-safe representation of a chat message for sandbox injection.
 */
interface SerializedMessage {
    id: string;
    role: string;
    content: string;
    timestamp?: number;
}

/** Regex matching the opening of a magic pattern (for quick pre-check). */
const TEST_REGEX = /\{\|[\s\S]*?\|\}/;

/** Global regex for extracting and iterating all magic patterns. */
const EXEC_REGEX = /\{\|([\s\S]*?)\|\}/g;

/**
 * Builds the JavaScript source that runs inside the QuickJS sandbox.
 * Injects `character`, `persona`, and `chat` as local variables before
 * executing the user's pattern code.
 */
function buildSandboxCode(
    code: string,
    character: Character,
    persona: MagicPatternContext["persona"],
    messages: SerializedMessage[]
): string {
    const characterJson = JSON.stringify(character);
    const personaJson = JSON.stringify(persona);
    const messagesJson = JSON.stringify(messages);

    return [
        `"use strict";`,
        `const character = ${characterJson};`,
        `const persona = ${personaJson};`,
        `const _messages = ${messagesJson};`,
        [
            `const chat = (a, b) => {`,
            `  const len = _messages.length;`,
            `  if (len === 0) return [];`,
            `  const idx = (i) => (i === -1 ? 0 : Math.max(0, len - 1 - i));`,
            `  const s = idx(Math.min(a, b));`,
            `  const e = idx(Math.max(a, b));`,
            `  return _messages.slice(s, e + 1);`,
            `};`,
        ].join("\n"),
        code,
    ].join("\n");
}

/**
 * Parses and executes magic patterns in text.
 *
 * Magic patterns use the syntax: {| javascript code |}
 * The code can be any expression (return value is used) or a statement block
 * with an explicit `return`. Context variables `character`, `persona`, and
 * `chat` are available inside the sandbox.
 *
 * @param text - The text containing magic patterns.
 * @param context - Context available to pattern scripts.
 * @returns The text with all patterns replaced by their evaluated results.
 *
 * When a pattern fails (script error, worker unavailable) the original pattern
 * text is kept in the output and the error is logged.
 */
export async function parseMagicPatterns(
    text: string,
    context: MagicPatternContext
): Promise<string> {
    // Fast path: no patterns present
    if (!TEST_REGEX.test(text)) {
        return text;
    }

    const { character, persona, chat } = context;

    // Pre-fetch all available messages so the sandbox chat() function can
    // operate on a frozen snapshot without needing cross-realm callbacks.
    const allMessages = chat(-10000, 10000);

    const serializedMessages: SerializedMessage[] = allMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: typeof msg.content?.data === "string" ? msg.content.data : "",
        timestamp: msg.timestamp,
    }));

    // Acquire the scripting worker (cached singleton).
    let worker: Awaited<ReturnType<typeof getScriptingWorker>>;
    try {
        worker = await getScriptingWorker();
    } catch (err) {
        Logger.error(`[MagicPattern] Failed to acquire scripting worker: ${String(err)}`);
        return text;
    }

    // Process patterns sequentially — each pattern may return a different
    // value and order must be preserved.
    const parts: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    EXEC_REGEX.lastIndex = 0;

    while ((match = EXEC_REGEX.exec(text)) !== null) {
        // Text segment before this match
        parts.push(text.slice(lastIndex, match.index));

        const fullMatch = match[0];
        const code = match[1].trim();
        lastIndex = match.index + fullMatch.length;

        if (!code) {
            parts.push(fullMatch);
            continue;
        }

        const wrappedCode = buildSandboxCode(code, character, persona, serializedMessages);

        try {
            const execResult = await worker.execute(wrappedCode, {
                characterId: character.id,
                timeout: 5000,
            });

            if (execResult.error) {
                Logger.error(`[MagicPattern] Script error in "${fullMatch}": ${execResult.error}`);
                parts.push(fullMatch);
            } else {
                parts.push(execResult.result !== undefined ? String(execResult.result) : "");
            }
        } catch (err) {
            Logger.error(`[MagicPattern] Execution error: ${String(err)}`);
            parts.push(fullMatch);
        }
    }

    // Remaining text after the last pattern
    parts.push(text.slice(lastIndex));

    return parts.join("");
}

export default parseMagicPatterns;
