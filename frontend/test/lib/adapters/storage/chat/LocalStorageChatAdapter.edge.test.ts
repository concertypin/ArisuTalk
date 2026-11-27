// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { LocalStorageChatAdapter } from "@/lib/adapters/storage/chat/LocalStorageChatAdapter";
import type { LocalChat } from "@/lib/interfaces";
import { createLocalStorageMock } from "@test/utils/localStorageMock";
import { makeMessage } from "@test/utils/message";

const CHATS_KEY = "arisutalk_chats_v1";
const MESSAGES_KEY = "arisutalk_messages_v1";

function makeChat(overrides: Partial<LocalChat> & { id: string }): LocalChat {
    return {
        characterId: "char-1",
        title: "Chat",
        name: "Chat",
        createdAt: 1000,
        updatedAt: 1000,
        lastMessage: 1000,
        ...overrides,
    };
}

function streamOf(text: string): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(text));
            controller.close();
        },
    });
}

describe("LocalStorageChatAdapter edge cases", () => {
    let adapter: LocalStorageChatAdapter;
    let logs: AnyLogEntry[];
    let detach: () => void;

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStorageChatAdapter();
        logs = [];
        detach = Logger.onLog((entry) => logs.push(entry));
    });

    afterEach(() => {
        detach();
        vi.unstubAllGlobals();
    });

    const errorMessages = () =>
        logs.filter((entry) => entry.level === "error").map((entry) => entry.message);

    describe("getChatsByParticipant", () => {
        it("returns chats owned by the character and group chats listing it as participant", async () => {
            await adapter.saveChat(makeChat({ id: "own", characterId: "char-A" }));
            await adapter.saveChat(
                makeChat({ id: "group", characterId: "char-B", participantIds: ["char-A", "x"] })
            );
            await adapter.saveChat(
                makeChat({ id: "other", characterId: "char-B", participantIds: ["char-C"] })
            );
            await adapter.saveChat(makeChat({ id: "noParticipants", characterId: "char-B" }));

            const found = await adapter.getChatsByParticipant("char-A");

            expect(found.map((chat) => chat.id).sort()).toEqual(["group", "own"]);
        });

        it("returns an empty list when nothing matches", async () => {
            await adapter.saveChat(makeChat({ id: "c1", characterId: "char-B" }));

            expect(await adapter.getChatsByParticipant("nobody")).toEqual([]);
        });
    });

    describe("updateChat", () => {
        it("merges the updates into the stored chat and keeps the other fields", async () => {
            await adapter.saveChat(makeChat({ id: "c1", name: "Old", title: "Old title" }));
            await adapter.saveChat(makeChat({ id: "c2", name: "Untouched" }));

            await adapter.updateChat("c1", { name: "New" });

            expect(await adapter.getChat("c1")).toMatchObject({
                id: "c1",
                name: "New",
                title: "Old title",
            });
            expect((await adapter.getChat("c2"))?.name).toBe("Untouched");
            expect(await adapter.getAllChats()).toHaveLength(2);
        });

        it("throws for an unknown chat id and does not create it", async () => {
            await expect(adapter.updateChat("ghost", { name: "x" })).rejects.toThrow(
                "Chat not found: ghost"
            );
            expect(await adapter.getChat("ghost")).toBeUndefined();
        });
    });

    describe("message updates", () => {
        it("updateMessage replaces the content and refreshes the timestamp of only that message", async () => {
            const chatId = await adapter.createChat("char-1");
            await adapter.addMessage(chatId, makeMessage("m1", "first", { chatId, timestamp: 1 }));
            await adapter.addMessage(chatId, makeMessage("m2", "second", { chatId, timestamp: 2 }));

            await adapter.updateMessage(chatId, "m1", { type: "text", data: "edited" });

            const messages = await adapter.getMessages(chatId);
            const m1 = messages.find((m) => m.id === "m1");
            const m2 = messages.find((m) => m.id === "m2");
            expect(m1?.content.data).toBe("edited");
            expect(m1?.timestamp).toBeGreaterThan(2);
            expect(m2?.content.data).toBe("second");
            expect(m2?.timestamp).toBe(2);
        });

        it("updateMessage does not touch a message with the same id in another chat", async () => {
            const chatA = await adapter.createChat("char-1");
            const chatB = await adapter.createChat("char-1");
            await adapter.addMessage(chatA, makeMessage("same", "A", { chatId: chatA }));
            await adapter.addMessage(chatB, makeMessage("same", "B", { chatId: chatB }));

            await adapter.updateMessage(chatB, "same", { type: "text", data: "B edited" });

            expect((await adapter.getMessages(chatA))[0].content.data).toBe("A");
            expect((await adapter.getMessages(chatB))[0].content.data).toBe("B edited");
        });

        it("deleteMessage removes only the targeted message", async () => {
            const chatId = await adapter.createChat("char-1");
            await adapter.addMessage(chatId, makeMessage("m1", "one", { chatId }));
            await adapter.addMessage(chatId, makeMessage("m2", "two", { chatId }));

            await adapter.deleteMessage(chatId, "m1");

            const remaining = await adapter.getMessages(chatId);
            expect(remaining.map((m) => m.id)).toEqual(["m2"]);
        });

        it("deleteMessage throws when the message belongs to another chat", async () => {
            const chatA = await adapter.createChat("char-1");
            await adapter.addMessage(chatA, makeMessage("m1", "one", { chatId: chatA }));

            await expect(adapter.deleteMessage("other-chat", "m1")).rejects.toThrow(
                "Message not found: m1"
            );
            expect(await adapter.getMessages(chatA)).toHaveLength(1);
        });
    });

    describe("addMessage", () => {
        it("stores the message under the target chat and bumps that chat's lastMessage", async () => {
            const chatId = await adapter.createChat("char-1");
            await adapter.saveChat(
                makeChat({ id: chatId, characterId: "char-1", lastMessage: 5, updatedAt: 5 })
            );

            await adapter.addMessage(chatId, makeMessage("m1", "hi", { chatId: "wrong-chat" }));

            const [stored] = await adapter.getMessages(chatId);
            expect(stored.id).toBe("m1");
            expect(stored.chatId).toBe(chatId);
            expect(await adapter.getMessages("wrong-chat")).toEqual([]);
            const chat = await adapter.getChat(chatId);
            expect(chat?.lastMessage).toBeGreaterThan(5);
            expect(chat?.updatedAt).toBeGreaterThan(5);
        });
    });

    describe("corrupted or invalid stored data", () => {
        it("treats unparseable chat JSON as empty and logs the parse failure", async () => {
            localStorage.setItem(CHATS_KEY, "{ not json");

            expect(await adapter.getAllChats()).toEqual([]);
            expect(errorMessages()).toContain("Failed to parse stored data");
        });

        it("treats a non-array chat payload as empty", async () => {
            localStorage.setItem(CHATS_KEY, JSON.stringify({ id: "c1" }));

            expect(await adapter.getAllChats()).toEqual([]);
        });

        it("drops entries that are not valid chats and keeps valid ones", async () => {
            const valid = makeChat({ id: "ok" });
            localStorage.setItem(
                CHATS_KEY,
                JSON.stringify([valid, null, 42, { id: "no-name", characterId: "c" }])
            );

            expect(await adapter.getAllChats()).toEqual([valid]);
        });

        it("drops stored messages whose content is malformed", async () => {
            const good = makeMessage("good", "hello", { chatId: "c1" });
            localStorage.setItem(
                MESSAGES_KEY,
                JSON.stringify([
                    good,
                    { id: "m", chatId: "c1", role: "user" },
                    { id: "m2", chatId: "c1", role: "user", content: { type: "text" } },
                ])
            );

            expect(await adapter.getMessages("c1")).toEqual([good]);
        });

        it("returns no chats and logs when reading localStorage itself fails", async () => {
            const storage = createLocalStorageMock(vi);
            vi.mocked(storage.getItem).mockImplementation(() => {
                throw new Error("storage disabled");
            });
            vi.stubGlobal("localStorage", storage);

            expect(await adapter.getAllChats()).toEqual([]);
            expect(errorMessages()).toContain("Failed to load chats");
        });

        it("returns no messages and logs when reading localStorage itself fails", async () => {
            const storage = createLocalStorageMock(vi);
            vi.mocked(storage.getItem).mockImplementation(() => {
                throw new Error("storage disabled");
            });
            vi.stubGlobal("localStorage", storage);

            expect(await adapter.getMessages("c1")).toEqual([]);
            expect(errorMessages()).toContain("Failed to load messages");
        });
    });

    describe("storage write failures", () => {
        it("logs instead of throwing when chats cannot be saved, and nothing is persisted", async () => {
            const storage = createLocalStorageMock(vi);
            vi.mocked(storage.setItem).mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });
            vi.stubGlobal("localStorage", storage);

            await expect(adapter.saveChat(makeChat({ id: "c1" }))).resolves.toBeUndefined();

            expect(errorMessages()).toContain("Failed to save chats");
            expect(storage.getItem(CHATS_KEY)).toBeNull();
        });

        it("logs instead of throwing when messages cannot be saved", async () => {
            const storage = createLocalStorageMock(vi);
            vi.stubGlobal("localStorage", storage);
            const chatId = await adapter.createChat("char-1");
            vi.mocked(storage.setItem).mockImplementation(() => {
                throw new Error("QuotaExceededError");
            });

            await expect(
                adapter.addMessage(chatId, makeMessage("m1", "lost", { chatId }))
            ).resolves.toBeUndefined();

            expect(errorMessages()).toContain("Failed to save messages");
            expect(storage.getItem(MESSAGES_KEY)).toBeNull();
        });
    });

    describe("importData", () => {
        it("replaces stored chats and messages with the valid imported entries only", async () => {
            await adapter.saveChat(makeChat({ id: "old" }));
            const chat = makeChat({ id: "new" });
            const message = makeMessage("m1", "imported", { chatId: "new" });
            const payload = JSON.stringify({
                chats: [chat, { id: "broken" }],
                messages: [message, { id: "broken-message" }],
            });

            await adapter.importData(streamOf(payload));

            expect(await adapter.getAllChats()).toEqual([chat]);
            expect(await adapter.getMessages("new")).toEqual([message]);
        });

        it("leaves existing data untouched when the payload has no usable chats or messages", async () => {
            await adapter.saveChat(makeChat({ id: "keep" }));

            await adapter.importData(streamOf(JSON.stringify({ chats: "nope", messages: 7 })));

            expect((await adapter.getAllChats()).map((c) => c.id)).toEqual(["keep"]);
        });
    });

    describe("exportData", () => {
        it("serializes stored chats and messages as JSON", async () => {
            const chatId = await adapter.createChat("char-1", "Exported");
            await adapter.addMessage(chatId, makeMessage("m1", "payload", { chatId }));

            const text = await new Response(await adapter.exportData()).text();
            const parsed: unknown = JSON.parse(text);

            expect(parsed).toMatchObject({
                chats: [{ id: chatId, title: "Exported" }],
                messages: [{ id: "m1", chatId, content: { data: "payload" } }],
            });
        });
    });
});
