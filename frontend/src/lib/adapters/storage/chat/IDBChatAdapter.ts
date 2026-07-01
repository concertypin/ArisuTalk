import type { Chat, Message } from "@arisutalk/character-spec/v0/Character";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { IChatStorageAdapter, LocalChat, ChatType } from "@/lib/interfaces";
import { cloneDeep } from "lodash-es";

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
        // Remove Svelte proxy wrapper by cloning
        const plainChat = cloneDeep(chat);
        await this.db.chats.put(plainChat);
    }

    private toLocalChat(chat: Chat): LocalChat {
        return {
            ...chat,
            name:
                ((chat as Record<string, unknown>).name as string | undefined) || chat.title || "",
            lastMessage: chat.updatedAt || chat.createdAt || 0,
            characterId: chat.characterId,
            chatType:
                ((chat as Record<string, unknown>).chatType as ChatType | undefined) || "direct",
            participantIds:
                ((chat as Record<string, unknown>).participantIds as string[] | undefined) || [],
            creatorId: (chat as Record<string, unknown>).creatorId as string | undefined,
            parentChatId: (chat as Record<string, unknown>).parentChatId as string | undefined,
            branchRootId: (chat as Record<string, unknown>).branchRootId as string | undefined,
            affection: (chat as Record<string, unknown>).affection as
                LocalChat["affection"] | undefined,
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

    async createChat(
        characterId: string,
        title?: string,
        chatType: ChatType = "direct",
        participantIds?: string[]
    ): Promise<string> {
        const id = crypto.randomUUID();
        const now = Date.now();

        // Build the chat record with base + extended fields
        const chatRecord = {
            id,
            characterId,
            title: title || "",
            createdAt: now,
            updatedAt: now,
            chatType,
            participantIds: participantIds || [],
        };

        // Anti-proxy
        const plainChat = cloneDeep(chatRecord);
        await this.db.chats.put(plainChat);
        return id;
    }

    async getChatsByCharacter(characterId: string): Promise<LocalChat[]> {
        const arr = await this.db.chats
            .filter(
                (c) =>
                    c.characterId === characterId ||
                    (Array.isArray((c as Record<string, unknown>).participantIds) &&
                        ((c as Record<string, unknown>).participantIds as string[]).includes(
                            characterId
                        ))
            )
            .toArray();
        return arr.map((c) => this.toLocalChat(c));
    }

    async getChatsByParticipant(characterId: string): Promise<LocalChat[]> {
        const arr = await this.db.chats
            .filter(
                (c) =>
                    c.characterId === characterId ||
                    (Array.isArray((c as Record<string, unknown>).participantIds) &&
                        ((c as Record<string, unknown>).participantIds as string[]).includes(
                            characterId
                        ))
            )
            .toArray();
        return arr.map((c) => this.toLocalChat(c));
    }

    async updateChat(chatId: string, updates: Partial<LocalChat>): Promise<void> {
        const chat = await this.db.chats.get(chatId);
        if (!chat) throw new Error(`Chat not found: ${chatId}`);

        const updated = {
            ...chat,
            ...updates,
            updatedAt: Date.now(),
        };
        const plainChat = cloneDeep(updated);
        await this.db.chats.put(plainChat);
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
        // Remove Svelte proxy wrapper
        const plainMessage = cloneDeep(messageWithChatId);
        await this.db.messages.put(plainMessage);

        // Update chat's updatedAt timestamp
        chat.updatedAt = message.timestamp || Date.now();
        await this.db.chats.put(chat);
    }

    async getMessages(chatId: string): Promise<Message[]> {
        return this.db.messages.where("chatId").equals(chatId).sortBy("timestamp");
    }

    async updateMessage(
        chatId: string,
        messageId: string,
        content: Message["content"]
    ): Promise<void> {
        const message = await this.db.messages.get(messageId);
        if (!message || message.chatId !== chatId) {
            throw new Error(`Message not found: ${messageId}`);
        }
        message.content = content;
        message.timestamp = Date.now();
        // Remove Svelte proxy wrapper
        const plainMessage = cloneDeep(message);
        await this.db.messages.put(plainMessage);
    }

    async deleteMessage(chatId: string, messageId: string): Promise<void> {
        const message = await this.db.messages.get(messageId);
        if (!message || message.chatId !== chatId) {
            throw new Error(`Message not found: ${messageId}`);
        }
        await this.db.messages.delete(messageId);
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
        const data: unknown = JSON.parse(json);

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

export default IDBChatAdapter;
