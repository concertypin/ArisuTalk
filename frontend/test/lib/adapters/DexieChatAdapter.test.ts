import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieChatAdapter } from "@/lib/adapters/storage/chat/DexieChatAdapter";
import { getArisuDB } from "@/lib/adapters/storage/DexieDB";
import { exampleChatData } from "@/const/example_data";

describe("DexieChatAdapter", () => {
    let adapter: DexieChatAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexieChatAdapter();
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
});
