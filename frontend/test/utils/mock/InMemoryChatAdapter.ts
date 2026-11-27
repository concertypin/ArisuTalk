/**
 * @fileoverview In-memory `IChatStorageAdapter` that honors the full adapter contract.
 *
 * The real adapters are lossy in different ways (the localStorage one ignores the chat type and
 * participants, the IndexedDB one strips branching fields on update), so store-level behavior such
 * as branching or group participants cannot be observed through them. This fake keeps every
 * field, throws for missing chats and messages like the real adapters do, and hands out copies so
 * that mutating store state never silently edits "storage".
 */
import { cloneDeep } from "lodash-es";
import type { IChatStorageAdapter, LocalChat, ChatType } from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

/** In-memory chat storage for tests. Chats and messages are exposed for direct assertions. */
export class InMemoryChatAdapter implements IChatStorageAdapter {
    /** Stored chats by id. */
    readonly chats = new Map<string, LocalChat>();
    /** Stored messages by chat id, in insertion order. */
    readonly messages = new Map<string, Message[]>();
    private counter = 0;

    async init(): Promise<void> {}

    async createChat(
        characterId: string,
        title: string = "New Chat",
        chatType: ChatType = "direct",
        participantIds?: string[]
    ): Promise<string> {
        const id = `chat-${++this.counter}`;
        const now = Date.now();
        this.chats.set(id, {
            id,
            characterId,
            title,
            name: title,
            chatType,
            participantIds: participantIds ?? [],
            createdAt: now,
            updatedAt: now,
            lastMessage: now,
        });
        this.messages.set(id, []);
        return id;
    }

    async getChat(id: string): Promise<LocalChat | undefined> {
        return cloneDeep(this.chats.get(id));
    }

    async getAllChats(): Promise<LocalChat[]> {
        return cloneDeep([...this.chats.values()]);
    }

    async getChatsByCharacter(characterId: string): Promise<LocalChat[]> {
        return cloneDeep([...this.chats.values()].filter((c) => c.characterId === characterId));
    }

    async getChatsByParticipant(characterId: string): Promise<LocalChat[]> {
        return cloneDeep(
            [...this.chats.values()].filter((c) => c.participantIds?.includes(characterId))
        );
    }

    async updateChat(chatId: string, updates: Partial<LocalChat>): Promise<void> {
        const chat = this.chats.get(chatId);
        if (!chat) throw new Error(`Chat not found: ${chatId}`);
        this.chats.set(chatId, { ...chat, ...cloneDeep(updates) });
    }

    async addMessage(chatId: string, message: Message): Promise<void> {
        const list = this.messages.get(chatId);
        if (!list) throw new Error(`Chat not found: ${chatId}`);
        list.push(cloneDeep({ ...message, chatId }));
    }

    async deleteChat(id: string): Promise<void> {
        this.chats.delete(id);
        this.messages.delete(id);
    }

    async getMessages(chatId: string): Promise<Message[]> {
        return cloneDeep(this.messages.get(chatId) ?? []);
    }

    async updateMessage(
        chatId: string,
        messageId: string,
        content: Message["content"]
    ): Promise<void> {
        const message = this.messages.get(chatId)?.find((m) => m.id === messageId);
        if (!message) throw new Error(`Message not found: ${messageId}`);
        message.content = cloneDeep(content);
        message.timestamp = Date.now();
    }

    async deleteMessage(chatId: string, messageId: string): Promise<void> {
        const list = this.messages.get(chatId);
        const index = list?.findIndex((m) => m.id === messageId) ?? -1;
        if (!list || index === -1) throw new Error(`Message not found: ${messageId}`);
        list.splice(index, 1);
    }
}
