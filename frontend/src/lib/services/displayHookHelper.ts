/**
 * Display Hook Utilities
 * Helper functions to apply display hooks to message content
 */

import { applyDisplayHooks } from "./replaceHookService";
import type { Message } from "../stores/chat";

/**
 * Apply display hooks to a message's content for rendering
 * Returns the modified content without changing the stored message
 */
export async function getDisplayContent(message: Message): Promise<string> {
    const result = await applyDisplayHooks(message.content);
    return result.modified;
}

/**
 * Apply display hooks to multiple messages
 * Useful for rendering entire chat histories
 */
export async function getDisplayContents(
    messages: Message[]
): Promise<Map<number | string, string>> {
    const displayMap = new Map<number | string, string>();

    for (const message of messages) {
        const displayContent = await getDisplayContent(message);
        displayMap.set(message.id, displayContent);
    }

    return displayMap;
}

/**
 * Create a display version of a message
 * Used for rendering without modifying the actual message object
 */
export async function createDisplayMessage(message: Message): Promise<Message> {
    const displayContent = await getDisplayContent(message);
    return {
        ...message,
        content: displayContent,
    };
}

/**
 * Create display versions of multiple messages
 */
export async function createDisplayMessages(
    messages: Message[]
): Promise<Message[]> {
    return Promise.all(messages.map((msg) => createDisplayMessage(msg)));
}
