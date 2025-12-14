import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexieChatAdapter } from "@/lib/adapters/storage/chat/DexieChatAdapter";
import { getArisuDB } from "@/lib/adapters/storage/DexieDB";
import { exampleChatData, exampleMessageData } from "@/const/example_data";

describe("DexieChatAdapter (edge)", () => {
    let adapter: DexieChatAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexieChatAdapter();
        await adapter.init();
    });

    it("addMessage with missing timestamp sets chat.updatedAt and appends message", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        const msg = { ...exampleMessageData[0] };
        // remove timestamp
        // @ts-ignore
        delete msg.timestamp;
        await adapter.addMessage(chat.id, msg as any);
        const got = await adapter.getChat(chat.id);
        expect(got).toBeDefined();
        expect(got?.messages?.length).toBe(chat.messages.length + 1);
        expect(typeof got?.updatedAt).toBe("number");
    });

    it("addMessage on non-existent chat throws", async () => {
        const msg = structuredClone(exampleMessageData[0]);
        await expect(adapter.addMessage("no-such-chat", msg)).rejects.toThrow();
    });

    it("export/import roundtrip restores chats", async () => {
        const chat = structuredClone(exampleChatData);
        await adapter.saveChat(chat);
        const stream = await adapter.exportData();
        // Clear DB
        const dbinst = getArisuDB();
        await dbinst.chats.clear();
        let empty = await adapter.getAllChats();
        expect(empty.length).toBe(0);

        // Import
        await adapter.importData(stream);
        const restored = await adapter.getAllChats();
        expect(restored.length).toBeGreaterThanOrEqual(1);
        const r = restored.find((c) => c.id === chat.id);
        expect(r).toBeDefined();
    });
});
