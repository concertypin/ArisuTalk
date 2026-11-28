/**
 * @fileoverview Helpers for browser tests that run components against the real `chatStore`,
 * `characterStore` and settings, backed by the storage adapters the app resolves in browser runs.
 */
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import type { LocalChat } from "@/lib/interfaces";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";

/** Fields that can be seeded on top of a freshly created chat. */
export type SeedChatOptions = {
    /** Character the chat belongs to. Defaults to `char-1`. */
    characterId?: string;
    /** Chat title and name. Defaults to `Chat`. */
    title?: string;
    /** Chat type, applied as an update after creation. */
    chatType?: LocalChat["chatType"];
    /** Extra participants of a group or open chat. */
    participantIds?: string[];
    /** Sort key for "most recent chat" logic. */
    lastMessage?: number;
    /** Root chat id when the chat is a branch. */
    branchRootId?: string;
};

/**
 * Waits for the singletons to finish their asynchronous initialization.
 * Settings are loaded first, otherwise `chatStore` polls for them for up to five seconds.
 */
export async function initChatEnvironment(): Promise<void> {
    await settings.init();
    await chatStore.initPromise;
    await characterStore.initPromise;
}

/** Deletes persisted chats and clears the in-memory state of the chat and character stores. */
export async function resetChatEnvironment(): Promise<void> {
    const adapter = await StorageResolver.getChatAdapter();
    for (const chat of await adapter.getAllChats()) {
        await adapter.deleteChat(chat.id);
    }
    chatStore.chats.length = 0;
    chatStore.activeChatId = null;
    chatStore.activeMessages = [];
    chatStore.isGenerating = false;
    characterStore.characters.length = 0;
}

/**
 * Creates a chat through the store (so it is persisted and listed) and applies the extra fields.
 * @returns The id of the created chat.
 */
export async function seedChat(options: SeedChatOptions = {}): Promise<string> {
    const id = await chatStore.createChat(options.characterId ?? "char-1", options.title ?? "Chat");
    const updates: Partial<LocalChat> = {};
    if (options.chatType !== undefined) updates.chatType = options.chatType;
    if (options.participantIds !== undefined) updates.participantIds = options.participantIds;
    if (options.lastMessage !== undefined) updates.lastMessage = options.lastMessage;
    if (options.branchRootId !== undefined) updates.branchRootId = options.branchRootId;
    if (Object.keys(updates).length > 0) await chatStore.updateChat(id, updates);
    return id;
}

/** One message to seed into a chat. */
export type SeedMessage = {
    role: "user" | "assistant";
    text: string;
    /** Message timestamp in ms. Defaults to a strictly increasing value. */
    timestamp?: number;
};

/**
 * Makes `chatId` the active chat and stores the given messages in it, in order.
 * The messages end up in `chatStore.activeMessages`.
 */
export async function seedMessages(chatId: string, messages: SeedMessage[]): Promise<void> {
    await chatStore.setActiveChat(chatId);
    let counter = 1;
    for (const message of messages) {
        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: `${chatId}-m${counter}`,
                chatId,
                role: message.role,
                timestamp: message.timestamp ?? counter,
                content: { type: "text", data: message.text },
            })
        );
        counter++;
    }
}
