import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageChatAdapter } from "@/lib/adapters/storage/chat/LocalStorageChatAdapter";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";

describe("LocalStorageChatAdapter", () => {
    let adapter: LocalStorageChatAdapter;

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStorageChatAdapter();
        vi.clearAllMocks();
    });

    it("should create and retrieve a chat", async () => {
        const charId = "char-1";
        const chatId = await adapter.createChat(charId, "Test Chat");

        expect(chatId).toBeDefined();

        const chat = await adapter.getChat(chatId);
        expect(chat).toBeDefined();
        expect(chat?.characterId).toBe(charId);
        expect(chat?.title).toBe("Test Chat");
    });

    it("should list chats by character", async () => {
        const char1 = "char-1";
        const char2 = "char-2";

        await adapter.createChat(char1, "Chat 1");
        await adapter.createChat(char1, "Chat 2");
        await adapter.createChat(char2, "Chat 3");

        const chats1 = await adapter.getChatsByCharacter(char1);
        expect(chats1).toHaveLength(2);

        const chats2 = await adapter.getChatsByCharacter(char2);
        expect(chats2).toHaveLength(1);
    });

    it("should add and retrieve messages", async () => {
        const chatId = await adapter.createChat("char-1");
        const message: Message = {
            id: "msg-1",
            chatId, // Adapter overwrites this anyway
            role: "user",
            content: { type: "string", data: "Hello" },
            timestamp: Date.now(),
            inlays: [],
        };

        await adapter.addMessage(chatId, message);

        const messages = await adapter.getMessages(chatId);
        expect(messages).toHaveLength(1);
        expect(messages[0].content.data).toBe("Hello");
    });

    it("should delete chat and its messages", async () => {
        const chatId = await adapter.createChat("char-1");
        const message: Message = {
            id: "msg-1",
            chatId,
            role: "user",
            content: { type: "string", data: "Hello" },
            timestamp: Date.now(),
            inlays: [],
        };
        await adapter.addMessage(chatId, message);

        await adapter.deleteChat(chatId);

        const chat = await adapter.getChat(chatId);
        expect(chat).toBeUndefined();

        const messages = await adapter.getMessages(chatId);
        expect(messages).toHaveLength(0);
    });

    it("should export and import data", async () => {
        const charId = "char-export";
        const chatId = await adapter.createChat(charId, "Export Chat");
        const message: Message = {
            id: "msg-export",
            chatId,
            role: "user",
            content: { type: "text", data: "Export Me" },
            createdAt: new Date().toISOString(),
        };
        await adapter.addMessage(chatId, message);

        const stream = await adapter.exportData();
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const blob = new Blob(chunks);
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Create new adapter instance (simulating another session or device)
        const newAdapter = new LocalStorageChatAdapter();
        // Clear storage to ensure import works
        localStorage.clear();

        const importStream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(uint8Array);
                controller.close();
            },
        });

        await newAdapter.importData(importStream);

        const importedChats = await newAdapter.getAllChats();
        expect(importedChats).toHaveLength(1);
        expect(importedChats[0].id).toBe(chatId);

        const importedMessages = await newAdapter.getMessages(chatId);
        expect(importedMessages).toHaveLength(1);
        expect(importedMessages[0].content.data).toBe("Export Me");
    });
});
