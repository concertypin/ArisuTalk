// @vitest-environment jsdom
/**
 * @fileoverview Branching and affection of `ChatStore`.
 */
import { describe, it, expect, vi } from "vitest";
import { makeMessage } from "@test/utils/message";
import { createStore, installChatStoreHooks, openChat } from "@test/utils/chatStoreHarness";

// The magic pattern parser spins up a QuickJS web worker, which is not available in unit tests.
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
}));

installChatStoreHooks();

describe("branching", () => {
    /** Creates a group chat with three messages and activates it. */
    async function chatWithHistory() {
        const { store, adapter } = await createStore();
        const id = await store.createGroupChat(["alice", "bob"], "Story");
        await store.setActiveChat(id);
        await store.addMessage(
            id,
            makeMessage("m1", "one", { chatId: id, role: "user", timestamp: 1 })
        );
        await store.addMessage(
            id,
            makeMessage("m2", "two", { chatId: id, role: "assistant", timestamp: 2 })
        );
        await store.addMessage(
            id,
            makeMessage("m3", "three", { chatId: id, role: "user", timestamp: 3 })
        );
        return { store, adapter, id };
    }

    it("branchChat copies the history up to and including the branch message", async () => {
        const { store, adapter, id } = await chatWithHistory();

        const branchId = await store.branchChat("m2");

        const copied = adapter.messages.get(branchId) ?? [];
        expect(copied.map((m) => m.id)).toEqual(["m1", "m2"]);
        expect(copied.every((m) => m.chatId === branchId)).toBe(true);
        expect(adapter.messages.get(id)).toHaveLength(3);
    });

    it("branchChat tags copied messages and the new chat with branching metadata", async () => {
        const { store, adapter, id } = await chatWithHistory();

        const branchId = await store.branchChat("m2");

        const copied = adapter.messages.get(branchId) ?? [];
        expect(copied).toHaveLength(2);
        for (const message of copied) {
            expect(message).toMatchObject({ branchFromId: "m2", branchRootId: "m2" });
        }
        expect(adapter.chats.get(branchId)).toMatchObject({
            parentChatId: id,
            branchRootId: "m2",
        });
    });

    it("branchChat keeps the source chat type, participants and character, and names it (branch)", async () => {
        const { store, id } = await chatWithHistory();

        const branchId = await store.branchChat("m3");

        const branch = store.chats.find((c) => c.id === branchId);
        expect(branch).toMatchObject({
            name: "Story (branch)",
            characterId: "alice",
            chatType: "group",
            participantIds: ["bob"],
            parentChatId: id,
        });
    });

    it("branchChat from a branch keeps the original branch root", async () => {
        const { store } = await chatWithHistory();
        const firstBranch = await store.branchChat("m3");
        await store.setActiveChat(firstBranch);

        const secondBranch = await store.branchChat("m1");

        expect(store.chats.find((c) => c.id === secondBranch)?.branchRootId).toBe("m3");
    });

    it("branchChat copies the whole history when the message id is unknown", async () => {
        const { store, adapter } = await chatWithHistory();

        const branchId = await store.branchChat("no-such-message");

        expect(adapter.messages.get(branchId)?.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
    });

    it("branchChat rejects when there is no active chat", async () => {
        const { store } = await createStore();
        await expect(store.branchChat("m1")).rejects.toThrow("No active chat to branch from");
    });

    it("branchChat rejects when the active chat no longer exists in storage", async () => {
        const { store } = await createStore();
        store.activeChatId = "vanished";
        await expect(store.branchChat("m1")).rejects.toThrow("Source chat not found");
    });

    it("getBranches returns only the chats branched from the given chat", async () => {
        const { store, id } = await chatWithHistory();
        const branchA = await store.branchChat("m1");
        const branchB = await store.branchChat("m2");
        const unrelated = await store.createChat("carol", "Unrelated");

        const branches = await store.getBranches(id);

        expect(branches.map((c) => c.id).sort()).toEqual([branchA, branchB].sort());
        expect(branches.map((c) => c.id)).not.toContain(unrelated);
        await expect(store.getBranches(branchA)).resolves.toEqual([]);
    });
});

describe("affection", () => {
    it("updateAffection clamps the value to the -100..100 range", async () => {
        const { store } = await createStore();

        await store.updateAffection("alice", 250);
        expect(store.getAffection("alice")).toBe(100);

        await store.updateAffection("alice", -250);
        expect(store.getAffection("alice")).toBe(-100);
    });

    it("updateAffection without an active chat only updates the global map", async () => {
        const { store, adapter } = await createStore();
        const update = vi.spyOn(adapter, "updateChat");

        await store.updateAffection("alice", 40);

        expect(store.affectionMap["alice"]).toBe(40);
        expect(update).not.toHaveBeenCalled();
    });

    it("updateAffection persists a new entry on the active chat", async () => {
        const { store, adapter } = await createStore();
        const id = await openChat(store);

        await store.updateAffection("alice", 30);

        const stored = adapter.chats.get(id)?.affection;
        expect(stored).toMatchObject([{ characterId: "alice", value: 30 }]);
        expect(typeof stored?.[0].lastUpdated).toBe("number");
    });

    it("updateAffection replaces the entry of the same character and keeps other characters", async () => {
        const { store, adapter } = await createStore();
        const id = await openChat(store);
        await store.updateAffection("alice", 30);
        await store.updateAffection("bob", -5);

        await store.updateAffection("alice", 55);

        const stored = adapter.chats.get(id)?.affection ?? [];
        expect(stored.map((a) => [a.characterId, a.value])).toEqual([
            ["alice", 55],
            ["bob", -5],
        ]);
        // The reactive chat mirrors storage, so a reload would show the same values.
        const local = store.chats.find((c) => c.id === id)?.affection ?? [];
        expect(local.map((a) => [a.characterId, a.value])).toEqual([
            ["alice", 55],
            ["bob", -5],
        ]);
    });

    it("getAffection prefers the active chat's value over the global map", async () => {
        const { store } = await createStore();
        await openChat(store);
        store.affectionMap["alice"] = 10;
        store.chats[0].affection = [{ characterId: "alice", value: 77, lastUpdated: 1 }];

        expect(store.getAffection("alice")).toBe(77);
    });

    it("getAffection falls back to the global map, then to zero", async () => {
        const { store } = await createStore();
        await openChat(store);
        store.affectionMap["alice"] = 12;
        store.chats[0].affection = [{ characterId: "bob", value: 5, lastUpdated: 1 }];

        expect(store.getAffection("alice")).toBe(12);
        expect(store.getAffection("stranger")).toBe(0);
    });
});
