import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces/IChatStorageAdapter";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

const BASE_URL = "http://localhost:3000";

export class ServerChatAdapter implements IChatStorageAdapter {
    async init(): Promise<void> {
        // No-op
    }

    async createChat(characterId: string, title?: string): Promise<string> {
        const res = await fetch(`${BASE_URL}/chats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ characterId, title }),
        });
        if (!res.ok) throw new Error(`Failed to create chat: ${res.statusText}`);
        const data = (await res.json()) as { id: string };
        return data.id;
    }

    async getChat(id: string): Promise<LocalChat | undefined> {
        const res = await fetch(`${BASE_URL}/chats/${id}`);
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`Failed to get chat: ${res.statusText}`);
        const data = (await res.json()) as LocalChat;
        return data;
    }

    async getAllChats(): Promise<LocalChat[]> {
        const res = await fetch(`${BASE_URL}/chats`);
        if (!res.ok) throw new Error(`Failed to get all chats: ${res.statusText}`);
        const data = (await res.json()) as LocalChat[];
        return data;
    }

    async getChatsByCharacter(characterId: string): Promise<LocalChat[]> {
        // Fetch all and filter? Or specific endpoint?
        // Assuming server supports filtering or we filter client side for dev adapter
        const chats = await this.getAllChats();
        return chats.filter((c) => c.characterId === characterId);
    }

    async addMessage(chatId: string, message: Message): Promise<void> {
        const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });
        if (!res.ok) throw new Error(`Failed to add message: ${res.statusText}`);
    }

    async deleteChat(id: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/chats/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete chat: ${res.statusText}`);
    }

    async getMessages(chatId: string): Promise<Message[]> {
        const res = await fetch(`${BASE_URL}/chats/${chatId}/messages`);
        if (!res.ok) throw new Error(`Failed to get messages: ${res.statusText}`);
        const data = (await res.json()) as Message[];
        return data;
    }

    async updateMessage(
        chatId: string,
        messageId: string,
        content: Message["content"]
    ): Promise<void> {
        const res = await fetch(`${BASE_URL}/chats/${chatId}/messages/${messageId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error(`Failed to update message: ${res.statusText}`);
    }

    async deleteMessage(chatId: string, messageId: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/chats/${chatId}/messages/${messageId}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete message: ${res.statusText}`);
    }
}
export default ServerChatAdapter;
