// @vitest-environment jsdom
/**
 * @fileoverview Branching and affection of `ChatStore`.
 */
import { describe, it, expect, vi } from "vitest";
import { createStore, installChatStoreHooks, openChat } from "@test/utils/chatStoreHarness";

// The magic pattern parser spins up a QuickJS web worker, which is not available in unit tests.
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
}));

installChatStoreHooks();

describe("affection", () => {
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
});
