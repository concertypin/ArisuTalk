/**
 * @fileoverview Shared message fixture for tests that need a valid `Message`.
 */
import { apply } from "@arisutalk/character-spec/utils";
import { MessageSchema, type Message } from "@arisutalk/character-spec/v0/Character/Message";

/**
 * Builds a valid text message with every schema default filled in.
 * @param id - Message id.
 * @param text - Text content.
 * @param options - `chatId` (default `chat-1`), `role` (default `user`) and `timestamp` (default 1).
 * @returns A fresh, schema-parsed message.
 */
export function makeMessage(
    id: string,
    text: string,
    options: { chatId?: string; role?: Message["role"]; timestamp?: number } = {}
): Message {
    return apply(MessageSchema, {
        id,
        chatId: options.chatId ?? "chat-1",
        role: options.role ?? "user",
        content: { type: "text", data: text },
        timestamp: options.timestamp ?? 1,
    });
}
