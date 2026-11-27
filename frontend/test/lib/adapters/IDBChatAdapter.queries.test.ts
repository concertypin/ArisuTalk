import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { IDBChatAdapter } from "@/lib/adapters/storage/chat/IDBChatAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";

describe("IDBChatAdapter participant queries and chat updates", () => {
    const db = getArisuDB();
    let adapter: IDBChatAdapter;

    beforeEach(async () => {
        await db.delete();
        adapter = new IDBChatAdapter();
        await adapter.init();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("getChatsByParticipant", () => {
        it("returns only group chats that list the character as a participant", async () => {
            const group = await adapter.createChat("owner", "Group", "group", ["char-A", "char-B"]);
            await adapter.createChat("owner", "Other group", "group", ["char-C"]);
            // A direct chat owned by the character is not a participation entry.
            await adapter.createChat("char-A", "Direct");

            const found = await adapter.getChatsByParticipant("char-A");

            expect(found.map((chat) => chat.id)).toEqual([group]);
            expect(found[0].participantIds).toEqual(["char-A", "char-B"]);
            expect(found[0].chatType).toBe("group");
        });

        it("returns an empty list when no chat includes the participant", async () => {
            await adapter.createChat("char-A", "Direct");

            expect(await adapter.getChatsByParticipant("nobody")).toEqual([]);
        });
    });

    describe("getChatsByCharacter", () => {
        it("includes group chats where the character only participates", async () => {
            const direct = await adapter.createChat("char-A", "Direct");
            const group = await adapter.createChat("owner", "Group", "group", ["char-A"]);
            await adapter.createChat("owner", "Unrelated", "group", ["char-Z"]);

            const found = await adapter.getChatsByCharacter("char-A");

            expect(found.map((chat) => chat.id).sort()).toEqual([direct, group].sort());
        });
    });

    describe("updateChat", () => {
        it("persists the new title, keeps identity fields and refreshes updatedAt", async () => {
            vi.useFakeTimers({ toFake: ["Date"] });
            vi.setSystemTime(1_000);
            const chatId = await adapter.createChat("char-A", "Before");
            vi.setSystemTime(5_000);

            await adapter.updateChat(chatId, { title: "After" });

            const updated = await adapter.getChat(chatId);
            expect(updated).toMatchObject({
                id: chatId,
                characterId: "char-A",
                title: "After",
                createdAt: 1_000,
                updatedAt: 5_000,
            });
        });

        it("does not remove the chat's messages or touch other chats", async () => {
            const chatId = await adapter.createChat("char-A", "Chat");
            const otherId = await adapter.createChat("char-B", "Other");
            await adapter.addMessage(chatId, {
                id: "m1",
                chatId,
                role: "user",
                content: { type: "text", data: "keep me" },
                timestamp: 10,
                inlays: [],
            });

            await adapter.updateChat(chatId, { title: "Renamed" });

            expect((await adapter.getMessages(chatId)).map((m) => m.id)).toEqual(["m1"]);
            expect((await adapter.getChat(otherId))?.title).toBe("Other");
            expect(await adapter.getAllChats()).toHaveLength(2);
        });
    });
});
