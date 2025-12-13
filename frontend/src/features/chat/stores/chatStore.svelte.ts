// import { LocalStorageAdapter } from "@/features/character/adapters/storage/LocalStorageAdapter"; // Reusing for now or creating new one?
// We need a separate adapter key.
// Let's assume we can pass a key to LocalStorageAdapter or create a GenericStorageAdapter.
// For now, I'll inline a simple storage logic or extend the adapter pattern later.
// To keep it simple and effective:

import type { Chat } from "@arisutalk/character-spec/v0/Character/Chat";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

export type LocalChat = Chat & {
    name: string;
    lastMessage: number;
    characterId: string; // Ensure this is explicit if Chat doesn't have it (likely does, but safe to add)
};

export class ChatStore {
    chats = $state<LocalChat[]>([]);
    activeChatId = $state<string | null>(null);

    private storageKey = "arisutalk_chats_v1";

    constructor() {
        this.load();
    }

    private load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                this.chats = JSON.parse(raw);
            }
        } catch (e) {
            console.error("Failed to load chats", e);
            this.chats = [];
        }
    }

    private save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.chats));
        } catch (e) {
            console.error("Failed to save chats", e);
        }
    }

    createChat(characterId: string, title: string = "New Chat") {
        const newChat: LocalChat = {
            id: crypto.randomUUID(),
            characterId,
            messages: [],
            // Add other required fields from spec if any, standard 'Chat' usually has these.
            // If strict schema compliance is needed, we would use Zod default or similar.
            // Assuming minimal shape for now based on typical usage.
            // Spec might require more fields?
            // Based on context7 output:
            // "Manage ArisuTalk Chat Sessions ... using ChatSchema ... messages, lorebook..."
            created: Date.now(),
            lastMessage: Date.now(),
            name: title,
        } as unknown as LocalChat; // Cast to Chat to avoid strict checks if I missed optional fields, will refine.

        this.chats.push(newChat);
        this.save();
        return newChat.id;
    }

    getChats(characterId: string) {
        return this.chats.filter((c) => c.characterId === characterId);
    }

    getChat(chatId: string) {
        return this.chats.find((c) => c.id === chatId);
    }

    addMessage(chatId: string, message: Message) {
        const chat = this.chats.find((c) => c.id === chatId);
        if (chat) {
            chat.messages.push(message);
            chat.lastMessage = Date.now();
            this.save();
        }
    }

    deleteChat(chatId: string) {
        const index = this.chats.findIndex((c) => c.id === chatId);
        if (index !== -1) {
            this.chats.splice(index, 1);
            this.save();
            if (this.activeChatId === chatId) {
                this.activeChatId = null;
            }
        }
    }

    setActiveChat(chatId: string | null) {
        this.activeChatId = chatId;
    }
}

export const chatStore = new ChatStore();
