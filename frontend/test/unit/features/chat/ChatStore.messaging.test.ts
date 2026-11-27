// @vitest-environment jsdom
/**
 * @fileoverview Message generation of `ChatStore`: sending, aborting and regenerating, including system prompt, group context and hooks.
 */
import { describe, it, expect, vi } from "vitest";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import { hookService } from "@/lib/services/HookService";
import { createTestCharacter } from "@test/utils/character";
import { makeMessage } from "@test/utils/message";
import {
    createStore,
    installChatStoreHooks,
    openChat,
    replying,
    transcript,
    useProvider,
} from "@test/utils/chatStoreHarness";

// The magic pattern parser spins up a QuickJS web worker, which is not available in unit tests.
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
}));

installChatStoreHooks();

describe("sending messages", () => {
    it("sendMessage runs input and output hooks of the character with the active persona", async () => {
        const alice = createTestCharacter({ id: "alice", name: "Alice" });
        characterStore.characters.push(alice);
        const persona = { id: "p1", name: "Tester", description: "desc" };
        personaStore.personas.push(persona);
        personaStore.activePersonaId = "p1";
        const process = vi
            .spyOn(hookService, "process")
            .mockImplementation(async (content, _character, type) => `${type}(${content})`);
        const { store, adapter } = await createStore();
        const id = await openChat(store, "alice");

        await store.sendMessage("hello");

        expect(process).toHaveBeenNthCalledWith(
            1,
            "hello",
            expect.objectContaining({ id: "alice" }),
            "input",
            persona
        );
        expect(process).toHaveBeenNthCalledWith(
            2,
            "Reply",
            expect.objectContaining({ id: "alice" }),
            "output",
            persona
        );
        expect(adapter.messages.get(id)?.map((m) => m.content.data)).toEqual([
            "input(hello)",
            "output(Reply)",
        ]);
        expect(transcript(store.activeMessages)).toEqual([
            ["user", "input(hello)"],
            ["assistant", "output(Reply)"],
        ]);
    });
});

describe("regenerateMessage", () => {
    /** Creates an active chat with: user u1, assistant a1, user u2, assistant a2. */
    async function conversation() {
        const { store, adapter } = await createStore();
        const id = await openChat(store, "alice");
        await store.addMessage(
            id,
            makeMessage("u1", "first question", { chatId: id, role: "user", timestamp: 1 })
        );
        await store.addMessage(
            id,
            makeMessage("a1", "first answer", { chatId: id, role: "assistant", timestamp: 2 })
        );
        await store.addMessage(
            id,
            makeMessage("u2", "second question", { chatId: id, role: "user", timestamp: 3 })
        );
        await store.addMessage(
            id,
            makeMessage("a2", "second answer", { chatId: id, role: "assistant", timestamp: 4 })
        );
        return { store, adapter, id };
    }

    it("applies output hooks to the regenerated reply", async () => {
        characterStore.characters.push(createTestCharacter({ id: "alice", name: "Alice" }));
        vi.spyOn(hookService, "process").mockImplementation(
            async (content, _character, type) => `${type}(${content})`
        );
        const { store, adapter, id } = await conversation();
        await useProvider(store, replying("raw"));

        await store.regenerateMessage("a2");

        expect(store.activeMessages.at(-1)?.content.data).toBe("output(raw)");
        expect(adapter.messages.get(id)?.at(-1)?.content.data).toBe("output(raw)");
    });
});
