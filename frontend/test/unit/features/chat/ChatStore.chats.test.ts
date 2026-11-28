// @vitest-environment jsdom
/**
 * @fileoverview Chat management of `ChatStore`: creating, listing, updating and deleting chats, participants, and editing messages of the active chat.
 */
import { describe, it, expect, vi } from "vitest";
import { makeMessage } from "@test/utils/message";
import {
    createStore,
    installChatStoreHooks,
    openChat,
    transcript,
} from "@test/utils/chatStoreHarness";

// The magic pattern parser spins up a QuickJS web worker, which is not available in unit tests.
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
}));

installChatStoreHooks();

describe("chat management", () => {
    it("createChat defaults to a direct chat titled New Chat", async () => {
        const { store } = await createStore();

        const id = await store.createChat("char-1");

        expect(store.chats.find((c) => c.id === id)).toMatchObject({
            name: "New Chat",
            chatType: "direct",
        });
    });

    it("createChat keeps the list unchanged when the new chat cannot be read back", async () => {
        const { store, adapter } = await createStore();
        vi.spyOn(adapter, "getChat").mockResolvedValue(undefined);

        const id = await store.createChat("char-1", "Ghost");

        expect(id).toBeTruthy();
        expect(store.chats).toEqual([]);
    });

    it("createGroupChat makes the first character primary and the rest participants", async () => {
        const { store } = await createStore();

        const id = await store.createGroupChat(["alice", "bob", "carol"]);

        expect(store.chats.find((c) => c.id === id)).toMatchObject({
            characterId: "alice",
            chatType: "group",
            participantIds: ["bob", "carol"],
            name: "Group Chat (3 participants)",
        });
    });

    it("createGroupChat uses the given name", async () => {
        const { store } = await createStore();

        const id = await store.createGroupChat(["alice", "bob"], "Movie night");

        expect(store.chats.find((c) => c.id === id)?.name).toBe("Movie night");
    });

    it("createOpenChat creates an open chat for the character", async () => {
        const { store } = await createStore();

        const id = await store.createOpenChat("alice", "Lobby");

        expect(store.chats.find((c) => c.id === id)).toMatchObject({
            characterId: "alice",
            chatType: "open",
            name: "Lobby",
        });
    });

    it("getChats returns only the chats of that character", async () => {
        const { store } = await createStore();
        const mine = await store.createChat("alice", "Mine");
        await store.createChat("bob", "Theirs");

        const chats = await store.getChats("alice");

        expect(chats.map((c) => c.id)).toEqual([mine]);
    });

    it("getChatsByParticipant returns group chats that include the character", async () => {
        const { store } = await createStore();
        const group = await store.createGroupChat(["alice", "bob"]);
        await store.createChat("carol", "Solo");

        const chats = await store.getChatsByParticipant("bob");

        expect(chats.map((c) => c.id)).toEqual([group]);
    });

    it("getChat returns undefined for an unknown chat", async () => {
        const { store } = await createStore();
        await expect(store.getChat("missing")).resolves.toBeUndefined();
    });

    it("updateChat persists the change and mirrors it into the reactive chat", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createChat("char-1", "Old");

        await store.updateChat(id, { name: "Renamed" });

        expect(store.chats.find((c) => c.id === id)?.name).toBe("Renamed");
        expect(adapter.chats.get(id)?.name).toBe("Renamed");
    });

    it("updateChat rejects without touching the listed chat when storage no longer has it", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createChat("char-1", "Keep");
        adapter.chats.delete(id);

        await expect(store.updateChat(id, { name: "Lost" })).rejects.toThrow(
            `Chat not found: ${id}`
        );

        expect(store.chats.find((c) => c.id === id)?.name).toBe("Keep");
    });

    it("deleteChat on the active chat clears the active chat and its messages", async () => {
        const { store, adapter } = await createStore();
        const id = await openChat(store);
        await store.addMessage(
            id,
            makeMessage("m1", "hi", { chatId: id, role: "user", timestamp: 1 })
        );

        await store.deleteChat(id);

        expect(store.chats).toEqual([]);
        expect(store.activeChatId).toBeNull();
        expect(store.activeMessages).toEqual([]);
        expect(adapter.chats.has(id)).toBe(false);
    });

    it("deleteChat on another chat keeps the active chat and its messages", async () => {
        const { store } = await createStore();
        const active = await openChat(store, "char-1", "Active");
        const other = await store.createChat("char-2", "Other");
        await store.addMessage(
            active,
            makeMessage("m1", "hi", { chatId: active, role: "user", timestamp: 1 })
        );

        await store.deleteChat(other);

        expect(store.chats.map((c) => c.id)).toEqual([active]);
        expect(store.activeChatId).toBe(active);
        expect(store.activeMessages).toHaveLength(1);
    });
});

describe("participants", () => {
    it("addParticipant appends the character to storage and to the reactive chat", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createGroupChat(["alice", "bob"]);

        await store.addParticipant(id, "carol");

        expect(adapter.chats.get(id)?.participantIds).toEqual(["bob", "carol"]);
        expect(store.chats.find((c) => c.id === id)?.participantIds).toEqual(["bob", "carol"]);
    });

    it("addParticipant ignores a character that already participates", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createGroupChat(["alice", "bob"]);
        const update = vi.spyOn(adapter, "updateChat");

        await store.addParticipant(id, "bob");

        expect(update).not.toHaveBeenCalled();
        expect(store.chats.find((c) => c.id === id)?.participantIds).toEqual(["bob"]);
    });

    it("addParticipant rejects for an unknown chat", async () => {
        const { store } = await createStore();
        await expect(store.addParticipant("missing", "bob")).rejects.toThrow(
            "Chat missing not found"
        );
    });

    it("addParticipant starts a participant list on a chat that had none", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createChat("alice", "Direct");
        await adapter.updateChat(id, { participantIds: undefined });

        await store.addParticipant(id, "bob");

        expect(adapter.chats.get(id)?.participantIds).toEqual(["bob"]);
    });

    it("removeParticipant removes only that character", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createGroupChat(["alice", "bob", "carol"]);

        await store.removeParticipant(id, "bob");

        expect(adapter.chats.get(id)?.participantIds).toEqual(["carol"]);
        expect(store.chats.find((c) => c.id === id)?.participantIds).toEqual(["carol"]);
    });

    it("removeParticipant ignores a character that is not a participant", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createGroupChat(["alice", "bob"]);
        const update = vi.spyOn(adapter, "updateChat");

        await store.removeParticipant(id, "zed");

        expect(update).not.toHaveBeenCalled();
        expect(adapter.chats.get(id)?.participantIds).toEqual(["bob"]);
    });

    it("removeParticipant rejects for an unknown chat", async () => {
        const { store } = await createStore();
        await expect(store.removeParticipant("missing", "bob")).rejects.toThrow(
            "Chat missing not found"
        );
    });
});

describe("active chat and message editing", () => {
    it("setActiveChat loads the chat's messages and setActiveChat(null) clears them", async () => {
        const { store, adapter } = await createStore();
        const id = await store.createChat("char-1", "Chat");
        await adapter.addMessage(
            id,
            makeMessage("m1", "hello", { chatId: id, role: "user", timestamp: 1 })
        );
        await adapter.addMessage(
            id,
            makeMessage("m2", "hi", { chatId: id, role: "assistant", timestamp: 2 })
        );

        await store.setActiveChat(id);
        expect(store.activeChatId).toBe(id);
        expect(transcript(store.activeMessages)).toEqual([
            ["user", "hello"],
            ["assistant", "hi"],
        ]);

        await store.setActiveChat(null);
        expect(store.activeChatId).toBeNull();
        expect(store.activeMessages).toEqual([]);
    });

    it("addMessage to the active chat shows it in the UI list and bumps the chat's timestamps", async () => {
        const { store, adapter } = await createStore();
        const id = await openChat(store);
        const before = store.chats[0].updatedAt;
        vi.useFakeTimers({ now: before + 5000, toFake: ["Date"] });

        await store.addMessage(
            id,
            makeMessage("m1", "hello", { chatId: id, role: "user", timestamp: 1 })
        );

        expect(transcript(store.activeMessages)).toEqual([["user", "hello"]]);
        expect(adapter.messages.get(id)).toHaveLength(1);
        expect(store.chats[0].updatedAt).toBe(before + 5000);
        expect(store.chats[0].lastMessage).toBe(before + 5000);
    });

    it("addMessage to a chat that is not active persists it without touching the UI list", async () => {
        const { store, adapter } = await createStore();
        const active = await openChat(store, "char-1", "Active");
        const other = await store.createChat("char-2", "Other");

        await store.addMessage(
            other,
            makeMessage("m1", "psst", { chatId: other, role: "user", timestamp: 1 })
        );

        expect(store.activeChatId).toBe(active);
        expect(store.activeMessages).toEqual([]);
        expect(adapter.messages.get(other)).toHaveLength(1);
    });

    it("updateMessage persists the new text and refreshes the timestamp", async () => {
        const { store, adapter } = await createStore();
        const id = await openChat(store);
        await store.addMessage(
            id,
            makeMessage("m1", "typo", { chatId: id, role: "user", timestamp: 1 })
        );

        await store.updateMessage("m1", "fixed");

        expect(store.activeMessages[0].content).toEqual({ type: "text", data: "fixed" });
        expect(store.activeMessages[0].timestamp).toBeGreaterThan(1);
        expect(adapter.messages.get(id)?.[0].content).toEqual({ type: "text", data: "fixed" });
    });

    it("updateMessage does nothing without an active chat", async () => {
        const { store, adapter } = await createStore();
        const update = vi.spyOn(adapter, "updateMessage");

        await store.updateMessage("m1", "text");

        expect(update).not.toHaveBeenCalled();
    });

    it("updateMessage rejects for an unknown message and leaves the UI list unchanged", async () => {
        const { store } = await createStore();
        const id = await openChat(store);
        await store.addMessage(
            id,
            makeMessage("m1", "keep", { chatId: id, role: "user", timestamp: 1 })
        );

        await expect(store.updateMessage("nope", "x")).rejects.toThrow("Message not found: nope");

        expect(transcript(store.activeMessages)).toEqual([["user", "keep"]]);
    });

    it("deleteMessage does nothing without an active chat", async () => {
        const { store, adapter } = await createStore();
        const remove = vi.spyOn(adapter, "deleteMessage");

        await store.deleteMessage("m1");

        expect(remove).not.toHaveBeenCalled();
    });

    it("deleteMessage rejects for an unknown message and keeps the UI list", async () => {
        const { store } = await createStore();
        const id = await openChat(store);
        await store.addMessage(
            id,
            makeMessage("m1", "keep", { chatId: id, role: "user", timestamp: 1 })
        );

        await expect(store.deleteMessage("nope")).rejects.toThrow("Message not found: nope");

        expect(store.activeMessages).toHaveLength(1);
    });
});
