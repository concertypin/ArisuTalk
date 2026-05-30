// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageChatAdapter } from "@/lib/adapters/storage/chat/LocalStorageChatAdapter";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character";

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
            chatId,
            role: "user",
            content: { type: "text", data: "Hello" },
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
            content: { type: "text", data: "Hello" },
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

    it("should return undefined for non-existent chat", async () => {
        const chat = await adapter.getChat("non-existent");
        expect(chat).toBeUndefined();
    });

    it("should save a new chat and update an existing one", async () => {
        const chatId = await adapter.createChat("char-1", "Original");
        let chat = await adapter.getChat(chatId);
        expect(chat?.name).toBe("Original");

        // Update existing chat
        await adapter.saveChat({ ...chat!, name: "Updated" });
        const updated = await adapter.getChat(chatId);
        expect(updated?.name).toBe("Updated");

        // Save a full chat object (new chat path)
        const newChat = {
            id: "new-chat-id",
            characterId: "char-2",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            title: "Direct Save",
            lastMessage: Date.now(),
            name: "Direct Save",
        };
        await adapter.saveChat(newChat);
        const saved = await adapter.getChat("new-chat-id");
        expect(saved?.name).toBe("Direct Save");
    });

    it("should return all chats", async () => {
        const allChats = await adapter.getAllChats();
        expect(allChats).toEqual([]);

        await adapter.createChat("char-1", "Chat A");
        await adapter.createChat("char-2", "Chat B");

        const chats = await adapter.getAllChats();
        expect(chats).toHaveLength(2);
    });

    it("should do nothing when adding message to non-existent chat", async () => {
        const message: Message = {
            id: "orphan-msg",
            chatId: "no-such-chat",
            role: "user",
            content: { type: "text", data: "Orphan" },
            timestamp: Date.now(),
            inlays: [],
        };
        await adapter.addMessage("no-such-chat", message);

        const messages = await adapter.getMessages("no-such-chat");
        expect(messages).toHaveLength(0);
    });

    it("should throw when updating non-existent message", async () => {
        await expect(
            adapter.updateMessage("chat-1", "no-such-msg", {
                type: "text",
                data: "Updated",
            })
        ).rejects.toThrow("Message not found: no-such-msg");
    });

    it("should throw when deleting non-existent message", async () => {
        await expect(adapter.deleteMessage("chat-1", "no-such-msg")).rejects.toThrow(
            "Message not found: no-such-msg"
        );
    });

    it("should throw when importing corrupt data", async () => {
        const corruptStream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("not valid json"));
                controller.close();
            },
        });
        await expect(adapter.importData(corruptStream)).rejects.toThrow("Invalid data format");
    });

    it("should handle import with empty chats and messages", async () => {
        const emptyData = JSON.stringify({ chats: [], messages: [] });
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(emptyData));
                controller.close();
            },
        });
        await adapter.importData(stream);

        const chats = await adapter.getAllChats();
        expect(chats).toHaveLength(0);
    });

    it("should handle import with invalid structure (non-object)", async () => {
        // When data.root is not a Record, importData should return early (no-op)
        const invalidData = JSON.stringify("just a string");
        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(invalidData));
                controller.close();
            },
        });
        await adapter.importData(stream);

        const chats = await adapter.getAllChats();
        expect(chats).toHaveLength(0);
    });

    it("should export and import data", async () => {
        const charId = "char-export";
        const chatId = await adapter.createChat(charId, "Export Chat");

        expect(MessageSchema).toBeDefined();

        const message: Message = apply(MessageSchema, {
            id: "msg-export",
            chatId,
            role: "user",
            content: { type: "text", data: "Export Me" },
        });
        await adapter.addMessage(chatId, message);

        const stream = await adapter.exportData();
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        // Concatenate all chunks into single Uint8Array
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const uint8Array = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            uint8Array.set(chunk, offset);
            offset += chunk.length;
        }

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
