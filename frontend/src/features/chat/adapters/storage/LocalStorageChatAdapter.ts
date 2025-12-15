import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

export class LocalStorageChatAdapter implements IChatStorageAdapter {
    private readonly CHATS_KEY = "arisutalk_chats_v1";
    private readonly MESSAGES_KEY = "arisutalk_messages_v1";

    async init(): Promise<void> {
        // LocalStorage is synchronous and always ready in browser environment
        return Promise.resolve();
    }

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

    private getStoredChats(): LocalChat[] {
        const raw = localStorage.getItem(this.CHATS_KEY);
        if (!raw) return [];
        const chats = this.parseArray<LocalChat>(raw, this.isLocalChat.bind(this));
        return chats;
    }

    private saveStoredChats(chats: LocalChat[]): void {
        try {
            localStorage.setItem(this.CHATS_KEY, JSON.stringify(chats));
        } catch (e) {
            console.error("Failed to save chats", e);
        }
    }

    private getStoredMessages(): Message[] {
        const raw = localStorage.getItem(this.MESSAGES_KEY);
        if (!raw) return [];
        const messages = this.parseArray<Message>(raw, this.isMessage.bind(this));
        return messages;
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
            // Store message separately with chatId reference
            const messages = this.getStoredMessages();
            const messageWithChatId: Message = {
                ...message,
                chatId,
                inlays: message.inlays || [],
            };
            messages.push(messageWithChatId);
            this.saveStoredMessages(messages);

            // Update chat timestamp
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
        // Delete messages for this chat
        const messages = this.getStoredMessages();
        const filteredMessages = messages.filter((m) => m.chatId !== id);
        this.saveStoredMessages(filteredMessages);

        // Delete chat
        const chats = this.getStoredChats();
        const filtered = chats.filter((c) => c.id !== id);
        this.saveStoredChats(filtered);
    }
}
