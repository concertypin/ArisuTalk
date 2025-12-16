import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { IDBChatAdapter } from "@/lib/adapters/storage/chat/IDBChatAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import { exampleChatData, exampleMessageData } from "@/const/example_data";

describe("DexieChatAdapter (edge)", () => {
    let adapter: IDBChatAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new IDBChatAdapter();
        await adapter.init();
    });

    it("addMessage with missing timestamp sets chat.updatedAt and appends message", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        const msg = { ...exampleMessageData[0] };
        // remove timestamp
        delete (msg as { timestamp?: number }).timestamp;
        await adapter.addMessage(chat.id, msg);
        const got = await adapter.getChat(chat.id);
        expect(got).toBeDefined();
        // Messages are now stored separately, use getMessages
        const messages = await adapter.getMessages(chat.id);
        expect(messages.length).toBe(1);
        expect(typeof got?.updatedAt).toBe("number");
    });

    it("addMessage on non-existent chat throws", async () => {
        const msg = structuredClone(exampleMessageData[0]);
        await expect(adapter.addMessage("no-such-chat", msg)).rejects.toThrow();
    });

    it("export/import roundtrip restores chats and messages", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        // Add a message
        await adapter.addMessage(chat.id, exampleMessageData[0]);

        const stream = await adapter.exportData();
        // Clear DB
        const dbinst = getArisuDB();
        await dbinst.chats.clear();
        await dbinst.messages.clear();
        const empty = await adapter.getAllChats();
        expect(empty.length).toBe(0);

        // Import
        await adapter.importData(stream);
        const restored = await adapter.getAllChats();
        expect(restored.length).toBeGreaterThanOrEqual(1);
        const r = restored.find((c) => c.id === chat.id);
        expect(r).toBeDefined();
        // Check messages were also restored
        const restoredMsgs = await adapter.getMessages(chat.id);
        expect(restoredMsgs.length).toBe(1);
    });
});
