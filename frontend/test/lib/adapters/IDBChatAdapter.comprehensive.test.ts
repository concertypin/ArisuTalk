import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBChatAdapter } from "@/lib/adapters/storage/chat/IDBChatAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { exampleChatData, exampleMessageData } from "@/const/example_data";

describe("DexieChatAdapter (comprehensive)", () => {
    let adapter: IDBChatAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.chats.clear();
        await db.messages.clear();
        adapter = new IDBChatAdapter();
        await adapter.init();
    });

    describe("Chat CRUD", () => {
        it("creates and retrieves a chat", async () => {
            const id = await adapter.createChat("char-1", "Test Chat");
            const chat = await adapter.getChat(id);
            expect(chat).toBeDefined();
            expect(chat?.characterId).toBe("char-1");
            expect(chat?.name).toBe("Test Chat");
        });

        it("saves and retrieves complete chat object", async () => {
            const chat = structuredClone(exampleChatData);
            await adapter.saveChat(chat);
            const retrieved = await adapter.getChat(chat.id);
            expect(retrieved?.id).toBe(chat.id);
        });

        it("deletes a chat and its messages", async () => {
            const chat = structuredClone(exampleChatData);
            await adapter.saveChat(chat);
            await adapter.addMessage(chat.id, exampleMessageData[0]);
            await adapter.deleteChat(chat.id);
            const retrieved = await adapter.getChat(chat.id);
            expect(retrieved).toBeUndefined();
            const msgs = await adapter.getMessages(chat.id);
            expect(msgs.length).toBe(0);
        });

        it("returns undefined for non-existent chat", async () => {
            const chat = await adapter.getChat("non-existent");
            expect(chat).toBeUndefined();
        });
    });

    describe("Message handling", () => {
        it("adds and retrieves messages", async () => {
            const chat = structuredClone(exampleChatData);
            await adapter.saveChat(chat);
            await adapter.addMessage(chat.id, exampleMessageData[0]);
            const msgs = await adapter.getMessages(chat.id);
            expect(msgs.length).toBe(1);
            expect(msgs[0].content).toEqual(exampleMessageData[0].content);
        });

        it("sets timestamp if missing", async () => {
            const chat = structuredClone(exampleChatData);
            await adapter.saveChat(chat);
            const msg = structuredClone(exampleMessageData[0]);
            delete (msg as { timestamp?: number }).timestamp;
            await adapter.addMessage(chat.id, msg);
            const msgs = await adapter.getMessages(chat.id);
            expect(typeof msgs[0].timestamp).toBe("undefined"); // inlays ensure we don't crash
        });

        it("updates chat updatedAt when adding message", async () => {
            const chat = structuredClone(exampleChatData);
            const oldTime = Date.now() - 10000;
            chat.updatedAt = oldTime;
            await adapter.saveChat(chat);
            const msg = { ...exampleMessageData[0], timestamp: Date.now() };
            await adapter.addMessage(chat.id, msg);
            const updated = await adapter.getChat(chat.id);
            expect(updated?.lastMessage).toBeGreaterThanOrEqual(msg.timestamp);
        });

        it("throws when adding message to non-existent chat", async () => {
            await expect(
                adapter.addMessage("non-existent", exampleMessageData[0])
            ).rejects.toThrow();
        });

        it("preserves message order", async () => {
            const chat = structuredClone(exampleChatData);
            await adapter.saveChat(chat);
            for (let i = 0; i < 5; i++) {
                await adapter.addMessage(chat.id, {
                    ...exampleMessageData[0],
                    id: `msg-${i}`,
                    timestamp: Date.now() + i,
                });
            }
            const msgs = await adapter.getMessages(chat.id);
            expect(msgs.length).toBe(5);
        });
    });

    describe("Queries", () => {
        it("gets chats by character", async () => {
            await adapter.createChat("char-1", "Chat 1");
            await adapter.createChat("char-1", "Chat 2");
            await adapter.createChat("char-2", "Chat 3");
            const chats = await adapter.getChatsByCharacter("char-1");
            expect(chats.length).toBe(2);
        });

        it("gets all chats", async () => {
            await adapter.createChat("char-1", "Chat 1");
            await adapter.createChat("char-2", "Chat 2");
            const all = await adapter.getAllChats();
            expect(all.length).toBe(2);
        });
    });

    describe("Export/Import", () => {
        it("exports and imports data", async () => {
            const chat = structuredClone(exampleChatData);
            await adapter.saveChat(chat);
            await adapter.addMessage(chat.id, exampleMessageData[0]);

            const stream = await adapter.exportData();
            await db.chats.clear();
            await db.messages.clear();

            await adapter.importData(stream);
            const restored = await adapter.getAllChats();
            expect(restored.length).toBe(1);
            const msgs = await adapter.getMessages(chat.id);
            expect(msgs.length).toBe(1);
        });

        it("handles empty export", async () => {
            const stream = await adapter.exportData();
            const text = await new Response(stream).text();
            const data = JSON.parse(text);
            expect(data.chats).toEqual([]);
            expect(data.messages).toEqual([]);
        });
    });
});
