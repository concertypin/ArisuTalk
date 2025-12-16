import type { Chat, Message } from "@arisutalk/character-spec/v0/Character";
import { getArisuDB } from "../IndexedDBHelper";
import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";

export class IDBChatAdapter implements IChatStorageAdapter {
    private db = getArisuDB();

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    private isChat(value: unknown): value is Chat {
        return (
            this.isRecord(value) &&
            typeof value.id === "string" &&
            typeof value.characterId === "string"
        );
    }

    private isMessage(value: unknown): value is Message {
        return (
            this.isRecord(value) && typeof value.id === "string" && typeof value.chatId === "string"
        );
    }

    async init(): Promise<void> {
        await this.db.open();
    }

    async saveChat(chat: Chat): Promise<void> {
        await this.db.chats.put(chat);
    }

    private toLocalChat(chat: Chat): LocalChat {
        return {
            ...chat,
            name: chat.title || "",
            lastMessage: chat.updatedAt || chat.createdAt || 0,
            characterId: chat.characterId,
        };
    }

    async getChat(id: string): Promise<LocalChat | undefined> {
        const c = await this.db.chats.get(id);
        return c ? this.toLocalChat(c) : undefined;
    }

    async getAllChats(): Promise<LocalChat[]> {
        const arr = await this.db.chats.toArray();
        return arr.map((c) => this.toLocalChat(c));
    }

    async deleteChat(id: string): Promise<void> {
        await Promise.all([
            // Delete all messages for this chat
            this.db.messages.where("chatId").equals(id).delete(),
            // and delete the chat itself
            this.db.chats.delete(id),
        ]);
    }

    async createChat(characterId: string, title?: string): Promise<string> {
        const id = crypto.randomUUID();
        const now = Date.now();
        const chat: Chat = {
            id,
            characterId,
            title: title || "",
            createdAt: now,
            updatedAt: now,
        };
        await this.db.chats.put(chat);
        return id;
    }

    async getChatsByCharacter(characterId: string): Promise<LocalChat[]> {
        const arr = await this.db.chats.where("characterId").equals(characterId).toArray();
        return arr.map((c) => this.toLocalChat(c));
    }

    async addMessage(chatId: string, message: Message): Promise<void> {
        const chat = await this.db.chats.get(chatId);
        if (!chat) throw new Error(`Chat not found: ${chatId}`);

        // Store message separately with chatId reference
        const messageWithChatId: Message = {
            ...message,
            chatId,
            inlays: message.inlays || [],
        };
        await this.db.messages.put(messageWithChatId);

        // Update chat's updatedAt timestamp
        chat.updatedAt = message.timestamp || Date.now();
        await this.db.chats.put(chat);
    }

    async getMessages(chatId: string): Promise<Message[]> {
        return this.db.messages.where("chatId").equals(chatId).toArray();
    }

    // Provide export/import on chat adapter for convenience
    async exportData(): Promise<ReadableStream<Uint8Array>> {
        const chats = await this.db.chats.toArray();
        const messages = await this.db.messages.toArray();
        const json = JSON.stringify({ chats, messages });
        const enc = new TextEncoder().encode(json);
        return new ReadableStream({
            start(ctrl) {
                ctrl.enqueue(enc);
                ctrl.close();
            },
        });
    }

    async importData(stream: ReadableStream<Uint8Array>): Promise<void> {
        const buf = await new Response(stream).arrayBuffer();
        const json = new TextDecoder().decode(buf);
        const data = JSON.parse(json) as unknown;

        if (!this.isRecord(data)) return;

        const chatsRaw = data.chats;
        const chats = Array.isArray(chatsRaw)
            ? chatsRaw.filter((c): c is Chat => this.isChat(c))
            : [];

        const messagesRaw = data.messages;
        const messages = Array.isArray(messagesRaw)
            ? messagesRaw.filter((m): m is Message => this.isMessage(m))
            : [];

        await this.db.chats.clear();
        await this.db.messages.clear();

        if (chats.length) await this.db.chats.bulkPut(chats);
        if (messages.length) await this.db.messages.bulkPut(messages);
    }
}
