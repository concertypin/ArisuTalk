import type { LocalChat, IChatStorageAdapter } from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";

export class ChatStore {
    chats = $state<LocalChat[]>([]);
    activeChatId = $state<string | null>(null);
    /** Messages for the currently active chat */
    activeMessages = $state<Message[]>([]);
    private adapter: IChatStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IChatStorageAdapter) {
        this.adapter = adapter || StorageResolver.getChatAdapter();
        this.initPromise = this.load();
    }

    private async load() {
        try {
            await this.adapter.init();
            this.chats = await this.adapter.getAllChats();
        } catch (e) {
            console.error("Failed to load chats", e);
            this.chats = [];
        }
    }

    async createChat(characterId: string, title: string = "New Chat") {
        const chatId = await this.adapter.createChat(characterId, title);
        const newChat = await this.adapter.getChat(chatId);

        if (newChat) {
            this.chats.push(newChat);
        }

        return chatId;
    }

    async getChats(characterId: string) {
        return await this.adapter.getChatsByCharacter(characterId);
    }

    async getChat(chatId: string) {
        return await this.adapter.getChat(chatId);
    }

    async addMessage(chatId: string, message: Message) {
        await this.adapter.addMessage(chatId, message);
        const chat = this.chats.find((c) => c.id === chatId);

        if (chat) {
            chat.lastMessage = Date.now();
            chat.updatedAt = Date.now();
        }

        // Update activeMessages if this is the active chat
        if (chatId === this.activeChatId) {
            const messageWithChatId: Message = {
                ...message,
                chatId,
                inlays: message.inlays || [],
            };
            this.activeMessages.push(messageWithChatId);
        }
    }

    async deleteChat(chatId: string) {
        await this.adapter.deleteChat(chatId);
        const index = this.chats.findIndex((c) => c.id === chatId);

        if (index !== -1) {
            this.chats.splice(index, 1);
            if (this.activeChatId === chatId) {
                this.activeChatId = null;
                this.activeMessages = [];
            }
        }
    }

    async setActiveChat(chatId: string | null) {
        this.activeChatId = chatId;
        if (chatId && "getMessages" in this.adapter) {
            this.activeMessages = await (
                this.adapter as IChatStorageAdapter & {
                    getMessages: (id: string) => Promise<Message[]>;
                }
            ).getMessages(chatId);
        } else {
            this.activeMessages = [];
        }
    }
}

export const chatStore = new ChatStore();
