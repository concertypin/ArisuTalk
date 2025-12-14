import type { Chat, Message } from "@arisutalk/character-spec/v0/Character";
import { getArisuDB } from "../IndexedDBHelper";
import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";

export class DexieChatAdapter implements IChatStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.ready();
    }

    async saveChat(chat: Chat): Promise<void> {
        await this.db.chats.put(chat);
    }

    private async toLocalChat(chat: Chat): Promise<LocalChat> {
        // Get messages for this chat to find the last message timestamp
        const messages = await this.db.messages.where("chatId").equals(chat.id).toArray();
        const lastMessage =
            messages.length > 0
                ? messages[messages.length - 1].timestamp || chat.updatedAt || 0
                : chat.updatedAt || chat.createdAt || 0;

        return {
            ...chat,
            name: chat.title || "",
            lastMessage,
            characterId: chat.characterId,
        };
    }

    async getChat(id: string): Promise<LocalChat | undefined> {
        const c = await this.db.chats.get(id);
        return c ? this.toLocalChat(c) : undefined;
    }

    async getAllChats(): Promise<LocalChat[]> {
        const arr = await this.db.chats.toArray();
        return Promise.all(arr.map((c) => this.toLocalChat(c)));
    }

    async deleteChat(id: string): Promise<void> {
        // Delete all messages for this chat first
        const messages = await this.db.messages.where("chatId").equals(id).toArray();
        for (const msg of messages) {
            await this.db.messages.delete(msg.id);
        }
        await this.db.chats.delete(id);
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
        return Promise.all(arr.map((c) => this.toLocalChat(c)));
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
        const data = JSON.parse(json);
        if (Array.isArray(data.chats)) {
            await this.db.chats.clear();
            if (data.chats.length) await this.db.chats.bulkPut(data.chats);
        }
        if (Array.isArray(data.messages)) {
            await this.db.messages.clear();
            if (data.messages.length) await this.db.messages.bulkPut(data.messages);
        }
    }
}
