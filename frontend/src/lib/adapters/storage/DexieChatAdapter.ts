import type { Chat, Message } from "@arisutalk/character-spec/v0/Character";
import { getArisuDB } from "./DexieDB";
import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";

export class DexieChatAdapter implements IChatStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        // ensures DB is initialized
        return Promise.resolve();
    }

    async saveChat(chat: Chat): Promise<void> {
        await this.db.chats.put(chat);
    }

    private toLocalChat(chat: Chat): LocalChat {
        const lastMessage =
            chat.messages && chat.messages.length
                ? chat.messages[chat.messages.length - 1].timestamp || chat.updatedAt || 0
                : chat.updatedAt || chat.createdAt || 0;

        return {
            ...chat,
            name: chat.title || "",
            lastMessage,
            characterId: chat.characterId,
        } as LocalChat;
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
        await this.db.chats.delete(id);
    }

    async createChat(characterId: string, title?: string): Promise<string> {
        const id = crypto.randomUUID();
        const now = Date.now();
        const chat: Chat = {
            id,
            characterId,
            title: title || "",
            messages: [],
            createdAt: now,
            updatedAt: now,
        } as Chat;
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
        chat.messages = chat.messages || [];
        chat.messages.push(message);
        chat.updatedAt = message.timestamp || Date.now();
        await this.db.chats.put(chat);
    }

    // Provide export/import on chat adapter for convenience
    async exportData(): Promise<ReadableStream<Uint8Array>> {
        const chats = await this.getAllChats();
        const json = JSON.stringify({ chats });
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
    }
}
