// @vitest-environment jsdom
/**
 * @fileoverview Message generation of `ChatStore`: sending, aborting and regenerating, including system prompt, group context and hooks.
 */
import { describe, it, expect, vi } from "vitest";
import { SystemMessage } from "@langchain/core/messages";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import { hookService } from "@/lib/services/HookService";
import { Logger } from "@common/logger/Logger";
import { createTestCharacter } from "@test/utils/character";
import { makeMessage } from "@test/utils/message";
import {
    ScriptedProvider,
    createStore,
    installChatStoreHooks,
    openChat,
    replying,
    textOf,
    transcript,
    useProvider,
} from "@test/utils/chatStoreHarness";

// The magic pattern parser spins up a QuickJS web worker, which is not available in unit tests.
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
}));

installChatStoreHooks();

describe("sending messages", () => {
    it("sendMessage shows partial text while the reply is still streaming", async () => {
        const { store } = await createStore();
        await openChat(store);
        let release: () => void = () => {};
        const gate = new Promise<void>((resolve) => (release = resolve));
        await useProvider(
            store,
            new ScriptedProvider(async function* () {
                yield "Hel";
                await gate;
                yield "lo";
            })
        );

        const sending = store.sendMessage("Hi");
        await vi.waitFor(() => expect(store.activeMessages.at(-1)?.content.data).toBe("Hel"));
        expect(store.isGenerating).toBe(true);
        release();
        await sending;

        expect(store.activeMessages.at(-1)?.content.data).toBe("Hello");
        expect(store.isGenerating).toBe(false);
    });

    it("sendMessage does nothing without an active chat", async () => {
        const { store, adapter } = await createStore();
        const add = vi.spyOn(adapter, "addMessage");

        await store.sendMessage("Hello");

        expect(add).not.toHaveBeenCalled();
        expect(store.activeMessages).toEqual([]);
    });

    it("sendMessage does nothing without a provider", async () => {
        const { store, adapter } = await createStore();
        await openChat(store);
        store["activeProvider"] = null;
        const add = vi.spyOn(adapter, "addMessage");

        await store.sendMessage("Hello");

        expect(add).not.toHaveBeenCalled();
        expect(store.isGenerating).toBe(false);
    });

    it("sendMessage gives each new message a timestamp later than the previous one", async () => {
        const { store } = await createStore();
        const id = await openChat(store);
        await store.addMessage(
            id,
            makeMessage("future", "from the future", {
                chatId: id,
                role: "user",
                timestamp: 99_000,
            })
        );
        vi.useFakeTimers({ now: 10_000, toFake: ["Date"] });

        await store.sendMessage("Next");

        const [, user, assistant] = store.activeMessages;
        expect(user.timestamp).toBe(99_001);
        expect(assistant.timestamp).toBe(99_002);
    });

    it("sendMessage keeps the user's message, drops the empty reply and rethrows when the provider fails", async () => {
        const { store, adapter } = await createStore();
        const id = await openChat(store);
        await useProvider(
            store,
            new ScriptedProvider(async function* () {
                yield "";
                throw new Error("rate limited");
            })
        );
        const logError = vi.spyOn(Logger, "error").mockImplementation(() => {});

        await expect(store.sendMessage("Hello")).rejects.toThrow("rate limited");

        expect(transcript(store.activeMessages)).toEqual([["user", "Hello"]]);
        expect(adapter.messages.get(id)).toHaveLength(1);
        expect(store.isGenerating).toBe(false);
        expect(logError).toHaveBeenCalledWith("Generation failed", expect.any(Error));
        expect(Logger.structured).toHaveBeenCalledWith(
            "llm.request.error",
            expect.objectContaining({ errorMessage: "Error: rate limited" })
        );
    });

    it("sendMessage hands the provider the full history with the new user message last", async () => {
        const { store } = await createStore();
        const id = await openChat(store);
        await store.addMessage(
            id,
            makeMessage("m1", "earlier question", { chatId: id, role: "user", timestamp: 1 })
        );
        await store.addMessage(
            id,
            makeMessage("m2", "earlier answer", { chatId: id, role: "assistant", timestamp: 2 })
        );
        const provider = replying("ok");
        await useProvider(store, provider);

        await store.sendMessage("follow up");

        const sent = provider.received[0].filter((m) => !(m instanceof SystemMessage));
        expect(sent.map((m) => [m.type, textOf(m)])).toEqual([
            ["human", "earlier question"],
            ["ai", "earlier answer"],
            ["human", "follow up"],
        ]);
    });

    it("sendMessage sends the character and persona as the system prompt", async () => {
        characterStore.characters.push(
            createTestCharacter({
                id: "alice",
                name: "Alice",
                prompt: { description: "A stern librarian" },
            })
        );
        personaStore.personas.push({
            id: "p1",
            name: "Tester",
            description: "Writes unit tests for fun",
        });
        personaStore.activePersonaId = "p1";
        const { store } = await createStore();
        await openChat(store, "alice");
        const provider = replying("ok");
        await useProvider(store, provider);

        await store.sendMessage("Hello");

        const [system] = provider.received[0];
        expect(system).toBeInstanceOf(SystemMessage);
        expect(textOf(system)).toContain("A stern librarian");
        expect(textOf(system)).toContain("Writes unit tests for fun");
    });

    it("sendMessage labels open chats as open in the participant context", async () => {
        characterStore.characters.push(
            createTestCharacter({ id: "alice", name: "Alice" }),
            createTestCharacter({ id: "bob", name: "Bob" })
        );
        const { store } = await createStore();
        const id = await store.createOpenChat("alice", "Lobby");
        await store.updateChat(id, { participantIds: ["bob"] });
        await store.setActiveChat(id);
        const provider = replying("ok");
        await useProvider(store, provider);

        await store.sendMessage("Anyone here?");

        const context = provider.received[0].find((m) => textOf(m).startsWith("[Context:"));
        expect(textOf(context!)).toContain(
            "open chat. Primary character: Alice. Other participants: Bob."
        );
    });

    it("sendMessage adds no group context for direct chats or when no participant can be resolved", async () => {
        characterStore.characters.push(createTestCharacter({ id: "alice", name: "Alice" }));
        const { store } = await createStore();
        const directId = await openChat(store, "alice", "Direct");
        const direct = replying("ok");
        await useProvider(store, direct);
        await store.sendMessage("hi");

        const groupId = await store.createGroupChat(["alice", "unknown-character"]);
        await store.setActiveChat(groupId);
        const group = replying("ok");
        await useProvider(store, group);
        await store.sendMessage("hi");

        expect(directId).not.toBe(groupId);
        expect(direct.received[0].some((m) => textOf(m).startsWith("[Context:"))).toBe(false);
        expect(group.received[0].some((m) => textOf(m).startsWith("[Context:"))).toBe(false);
    });

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

    it("sendMessage skips hooks and warns when the chat's character is not loaded", async () => {
        const process = vi.spyOn(hookService, "process");
        const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});
        const { store } = await createStore();
        await openChat(store, "ghost");

        await store.sendMessage("hello");

        expect(process).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith(
            "ChatStore: Character with ID ghost not found. Hooks will be skipped."
        );
        expect(transcript(store.activeMessages)).toEqual([
            ["user", "hello"],
            ["assistant", "Reply"],
        ]);
    });

    it("sendMessage resets isGenerating and rethrows when an input hook fails", async () => {
        characterStore.characters.push(createTestCharacter({ id: "alice", name: "Alice" }));
        vi.spyOn(hookService, "process").mockRejectedValue(new Error("hook crashed"));
        vi.spyOn(Logger, "error").mockImplementation(() => {});
        const { store, adapter } = await createStore();
        const id = await openChat(store, "alice");

        await expect(store.sendMessage("hello")).rejects.toThrow("hook crashed");

        expect(store.isGenerating).toBe(false);
        expect(adapter.messages.get(id)).toEqual([]);
        expect(store.activeMessages).toEqual([]);
    });
});

describe("abortGeneration", () => {
    it("aborts the provider and clears isGenerating while a reply is streaming", async () => {
        const { store } = await createStore();
        await openChat(store);
        let release: () => void = () => {};
        const gate = new Promise<void>((resolve) => (release = resolve));
        const provider = new ScriptedProvider(async function* () {
            yield "partial";
            await gate;
        });
        await useProvider(store, provider);
        const sending = store.sendMessage("Hello");
        await vi.waitFor(() => expect(store.activeMessages.at(-1)?.content.data).toBe("partial"));

        store.abortGeneration();

        expect(provider.abortCalls).toBe(1);
        expect(store.isGenerating).toBe(false);
        release();
        await sending;
    });

    it("does not call the provider when nothing is being generated", async () => {
        const { store } = await createStore();
        const provider = replying("x");
        await useProvider(store, provider);

        store.abortGeneration();

        expect(provider.abortCalls).toBe(0);
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

    it("regenerates the last message using the whole earlier history", async () => {
        const { store } = await conversation();
        const provider = replying("better");
        await useProvider(store, provider);

        await store.regenerateMessage("a2");

        const history = provider.received[0].filter((m) => !(m instanceof SystemMessage));
        expect(history.map((m) => textOf(m))).toEqual([
            "first question",
            "first answer",
            "second question",
        ]);
    });

    it("re-sends the system prompt and group context on regeneration", async () => {
        characterStore.characters.push(
            createTestCharacter({
                id: "alice",
                name: "Alice",
                prompt: { description: "A stern librarian" },
            }),
            createTestCharacter({ id: "bob", name: "Bob" })
        );
        const { store } = await createStore();
        const id = await store.createGroupChat(["alice", "bob"]);
        await store.setActiveChat(id);
        await store.addMessage(
            id,
            makeMessage("u1", "question", { chatId: id, role: "user", timestamp: 1 })
        );
        await store.addMessage(
            id,
            makeMessage("a1", "answer", { chatId: id, role: "assistant", timestamp: 2 })
        );
        const provider = replying("again");
        await useProvider(store, provider);

        await store.regenerateMessage("a1");

        const [system, context] = provider.received[0];
        expect(system).toBeInstanceOf(SystemMessage);
        expect(textOf(system)).toContain("A stern librarian");
        expect(textOf(context)).toContain("Primary character: Alice. Other participants: Bob.");
    });

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

    it("ignores an unknown message id", async () => {
        const { store, adapter } = await conversation();
        const remove = vi.spyOn(adapter, "deleteMessage");
        const provider = replying("x");
        await useProvider(store, provider);

        await store.regenerateMessage("nope");

        expect(remove).not.toHaveBeenCalled();
        expect(provider.received).toEqual([]);
        expect(store.activeMessages).toHaveLength(4);
    });

    it("refuses to regenerate a user message", async () => {
        const { store, adapter } = await conversation();
        const remove = vi.spyOn(adapter, "deleteMessage");
        const provider = replying("x");
        await useProvider(store, provider);

        await store.regenerateMessage("u2");

        expect(remove).not.toHaveBeenCalled();
        expect(provider.received).toEqual([]);
        expect(store.activeMessages).toHaveLength(4);
    });

    it("does nothing without an active chat even when the messages are loaded", async () => {
        const { store, adapter } = await conversation();
        store.activeChatId = null;
        const remove = vi.spyOn(adapter, "deleteMessage");
        const provider = replying("x");
        await useProvider(store, provider);

        await store.regenerateMessage("a2");

        expect(remove).not.toHaveBeenCalled();
        expect(provider.received).toEqual([]);
        expect(store.activeMessages).toHaveLength(4);
    });

    it("does nothing without a provider even when the message exists", async () => {
        const { store, adapter } = await conversation();
        store["activeProvider"] = null;
        const remove = vi.spyOn(adapter, "deleteMessage");

        await store.regenerateMessage("a2");

        expect(remove).not.toHaveBeenCalled();
        expect(store.activeMessages).toHaveLength(4);
        expect(store.isGenerating).toBe(false);
    });

    it("regenerating a middle reply drops every later message from the list and from storage", async () => {
        const { store, adapter, id } = await conversation();
        const provider = replying("fresh");
        await useProvider(store, provider);

        await store.regenerateMessage("a1");

        expect(transcript(store.activeMessages)).toEqual([
            ["user", "first question"],
            ["assistant", "fresh"],
        ]);
        expect(transcript(adapter.messages.get(id) ?? [])).toEqual([
            ["user", "first question"],
            ["assistant", "fresh"],
        ]);
        const history = provider.received[0].filter((m) => !(m instanceof SystemMessage));
        expect(history.map((m) => textOf(m))).toEqual(["first question"]);
    });

    it("rethrows provider failures, leaves no empty reply and resets isGenerating", async () => {
        const { store } = await conversation();
        await useProvider(
            store,
            new ScriptedProvider(async function* () {
                yield "";
                throw new Error("provider down");
            })
        );
        const logError = vi.spyOn(Logger, "error").mockImplementation(() => {});

        await expect(store.regenerateMessage("a2")).rejects.toThrow("provider down");

        expect(transcript(store.activeMessages)).toEqual([
            ["user", "first question"],
            ["assistant", "first answer"],
            ["user", "second question"],
        ]);
        expect(store.isGenerating).toBe(false);
        expect(logError).toHaveBeenCalledWith("Regeneration failed", expect.any(Error));
    });

    it("rethrows storage failures while deleting the old replies and resets isGenerating", async () => {
        const { store, adapter } = await conversation();
        vi.spyOn(adapter, "deleteMessage").mockRejectedValue(new Error("storage locked"));
        vi.spyOn(Logger, "error").mockImplementation(() => {});

        await expect(store.regenerateMessage("a2")).rejects.toThrow("storage locked");

        expect(store.isGenerating).toBe(false);
    });
});
