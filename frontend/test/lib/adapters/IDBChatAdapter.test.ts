import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBChatAdapter } from "@/lib/adapters/storage/chat/IDBChatAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { exampleChatData } from "@/const/example_data";

describe("DexieChatAdapter", () => {
    let adapter: IDBChatAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new IDBChatAdapter();
        await adapter.init();
    });

    it("should save and retrieve a chat", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        const got = await adapter.getChat(chat.id);
        // Adapter may return enriched LocalChat; ensure stored fields match original chat
        expect(got).toMatchObject(chat);
    });

    it("should return all chats", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        const all = await adapter.getAllChats();
        expect(all.length).toBeGreaterThanOrEqual(1);
    });

    it("should delete a chat", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        await adapter.deleteChat(chat.id);
        const got = await adapter.getChat(chat.id);
        expect(got).toBeUndefined();
    });

    it("should update a message's content", async () => {
        const chatId = await adapter.createChat("char-1", "Test Chat");
        const message = {
            id: "msg-1",
            chatId,
            role: "user" as const,
            content: { type: "text" as const, data: "Original content" },
            timestamp: Date.now(),
            inlays: [],
        };
        await adapter.addMessage(chatId, message);

        const newContent = { type: "text" as const, data: "Updated content" };
        await adapter.updateMessage(chatId, message.id, newContent);

        const messages = await adapter.getMessages(chatId);
        expect(messages).toHaveLength(1);
        expect(messages[0].content.data).toBe("Updated content");
    });

    it("should throw when updating non-existent message", async () => {
        const chatId = await adapter.createChat("char-1", "Test Chat");
        const newContent = { type: "text" as const, data: "Updated" };

        await expect(adapter.updateMessage(chatId, "non-existent", newContent)).rejects.toThrow(
            "Message not found"
        );
    });

    it("should delete a message", async () => {
        const chatId = await adapter.createChat("char-1", "Test Chat");
        const message = {
            id: "msg-1",
            chatId,
            role: "user" as const,
            content: { type: "text" as const, data: "To be deleted" },
            timestamp: Date.now(),
            inlays: [],
        };
        await adapter.addMessage(chatId, message);

        await adapter.deleteMessage(chatId, message.id);

        const messages = await adapter.getMessages(chatId);
        expect(messages).toHaveLength(0);
    });

    it("should throw when deleting non-existent message", async () => {
        const chatId = await adapter.createChat("char-1", "Test Chat");

        await expect(adapter.deleteMessage(chatId, "non-existent")).rejects.toThrow(
            "Message not found"
        );
    });
});
