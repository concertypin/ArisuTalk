import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

/**
 * LocalStorage-based chat storage adapter.
 * For development/testing purposes only.
 */
export class LocalStorageChatAdapter implements IChatStorageAdapter {
    private readonly CHATS_KEY = "arisutalk_chats_v1";
    private readonly MESSAGES_KEY = "arisutalk_messages_v1";

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    private isLocalChat(value: unknown): value is LocalChat {
        return (
            this.isRecord(value) &&
            typeof value.id === "string" &&
            typeof value.characterId === "string" &&
            typeof value.name === "string" &&
            typeof value.lastMessage === "number"
        );
    }

    private isMessage(value: unknown): value is Message {
        return (
            this.isRecord(value) &&
            typeof value.id === "string" &&
            typeof value.chatId === "string" &&
            typeof value.role === "string" &&
            this.isRecord(value.content) &&
            typeof value.content.type === "string" &&
            "data" in value.content
        );
    }

    private parseArray<T>(raw: string, predicate: (value: unknown) => value is T): T[] {
        try {
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) return [];
            const parsedArray: unknown[] = parsed;
            return parsedArray.filter(predicate);
        } catch (e) {
            console.error("Failed to parse stored data", e);
            return [];
        }
    }

    async init(): Promise<void> {
        if (!import.meta.env.DEV) {
            console.warn("LocalStorageChatAdapter is for development/testing only.");
        }
        return Promise.resolve();
    }

    private getStoredChats(): LocalChat[] {
        try {
            const raw = localStorage.getItem(this.CHATS_KEY);
            if (!raw) return [];
            return this.parseArray<LocalChat>(raw, this.isLocalChat.bind(this));
        } catch (e) {
            console.error("Failed to load chats", e);
            return [];
        }
    }

    private saveStoredChats(chats: LocalChat[]): void {
        try {
            localStorage.setItem(this.CHATS_KEY, JSON.stringify(chats));
        } catch (e) {
            console.error("Failed to save chats", e);
        }
    }

    private getStoredMessages(): Message[] {
        try {
            const raw = localStorage.getItem(this.MESSAGES_KEY);
            if (!raw) return [];
            return this.parseArray<Message>(raw, this.isMessage.bind(this));
        } catch (e) {
            console.error("Failed to load messages", e);
            return [];
        }
    }

    private saveStoredMessages(messages: Message[]): void {
        try {
            localStorage.setItem(this.MESSAGES_KEY, JSON.stringify(messages));
        } catch (e) {
            console.error("Failed to save messages", e);
        }
    }

    async createChat(characterId: string, title: string = "New Chat"): Promise<string> {
        const chats = this.getStoredChats();
        const newChat: LocalChat = {
            id: crypto.randomUUID(),
            characterId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title,
            lastMessage: Date.now(),
            name: title,
        };

        chats.push(newChat);
        this.saveStoredChats(chats);
        return newChat.id;
    }

    async saveChat(chat: LocalChat): Promise<void> {
        const chats = this.getStoredChats();
        const index = chats.findIndex((c) => c.id === chat.id);
        if (index >= 0) {
            chats[index] = chat;
        } else {
            chats.push(chat);
        }
        this.saveStoredChats(chats);
    }

    async getChat(id: string): Promise<LocalChat | undefined> {
        const chats = this.getStoredChats();
        return chats.find((c) => c.id === id);
    }

    async getAllChats(): Promise<LocalChat[]> {
        return this.getStoredChats();
    }

    async getChatsByCharacter(characterId: string): Promise<LocalChat[]> {
        const chats = this.getStoredChats();
        return chats.filter((c) => c.characterId === characterId);
    }

    async addMessage(chatId: string, message: Message): Promise<void> {
        const chats = this.getStoredChats();
        const chatIndex = chats.findIndex((c) => c.id === chatId);

        if (chatIndex !== -1) {
            const messages = this.getStoredMessages();
            const messageWithChatId: Message = {
                ...message,
                chatId,
                inlays: message.inlays || [],
            };
            messages.push(messageWithChatId);
            this.saveStoredMessages(messages);

            chats[chatIndex].lastMessage = Date.now();
            chats[chatIndex].updatedAt = Date.now();
            this.saveStoredChats(chats);
        }
    }

    async getMessages(chatId: string): Promise<Message[]> {
        const messages = this.getStoredMessages();
        return messages.filter((m) => m.chatId === chatId);
    }

    async deleteChat(id: string): Promise<void> {
        const messages = this.getStoredMessages();
        const filteredMessages = messages.filter((m) => m.chatId !== id);
        this.saveStoredMessages(filteredMessages);

        const chats = this.getStoredChats();
        const filtered = chats.filter((c) => c.id !== id);
        this.saveStoredChats(filtered);
    }

    async exportData(): Promise<ReadableStream<Uint8Array>> {
        const data = {
            chats: this.getStoredChats(),
            messages: this.getStoredMessages(),
        };
        const json = JSON.stringify(data);
        const encoder = new TextEncoder();
        const uint8 = encoder.encode(json);

        return new ReadableStream({
            start(controller) {
                controller.enqueue(uint8);
                controller.close();
            },
        });
    }

    async importData(stream: ReadableStream<Uint8Array>): Promise<void> {
        try {
            const buffer = await new Response(stream).arrayBuffer();
            const json = new TextDecoder().decode(buffer);
            const data: unknown = JSON.parse(json);
            if (!this.isRecord(data)) return;

            const chats = Array.isArray(data.chats)
                ? data.chats.filter((c): c is LocalChat => this.isLocalChat(c))
                : [];
            if (chats.length) {
                this.saveStoredChats(chats);
            }

            const messages = Array.isArray(data.messages)
                ? data.messages.filter((m): m is Message => this.isMessage(m))
                : [];
            if (messages.length) {
                this.saveStoredMessages(messages);
            }
        } catch (e) {
            console.error("Failed to import data", e);
            throw new Error("Invalid data format");
        }
    }
}
