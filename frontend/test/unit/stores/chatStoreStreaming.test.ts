// @vitest-environment happy-dom
import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import type { BaseMessage } from "@langchain/core/messages";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { Logger } from "@common/logger/Logger";

/** Type guard for LangChain-style message objects. */
function hasType(msg: unknown): msg is { _getType: () => string; content: string } {
    return (
        typeof msg === "object" &&
        msg !== null &&
        "_getType" in msg &&
        typeof msg._getType === "function"
    );
}
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
    TEST_REGEX: /\{\|[\s\S]*?\|\}/,
}));
// Mock settings to avoid 5s timeout in chatStore.initialize()
vi.mock("@/lib/stores/settings.svelte", () => ({
    settings: {
        isLoaded: true,
        value: {
            llmConfigs: [],
            activeLLMConfigId: null,
            model: "test-model",
            prompt: { generationPrompt: "Test system prompt" },
        },
        init: vi.fn(),
        save: vi.fn(),
    },
}));

describe("ChatStore Streaming", () => {
    beforeEach(async () => {
        // Reset provider state: neutralize disconnect so setProvider doesn't
        // hang on cleanup, then force creation of a fresh mock provider.
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        chatStore["activeProvider"] = null;
        chatStore.isGenerating = false;
        chatStore.activeChatId = null;
        chatStore.chats = [];
        chatStore.activeMessages = [];
        chatStore.affectionMap = {};

        // Character store is also a module-level singleton; reset its list
        // to prevent cross-test participants from leaking into group chat tests.
        const { characterStore } =
            await import("@/features/character/stores/characterStore.svelte");
        characterStore.characters = [];

        // Storage adapters are also module-level singletons cached on
        // StorageResolver. Reset them so the next test rebuilds against a
        // clean localStorage state (defensive against any adapter cache
        // leaking between tests).
        const { StorageResolver } = await import("@/lib/adapters/storage/storageResolver");
        StorageResolver.reset();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    test("sendMessage streams response from MockChatProvider", async () => {
        // Initialize store
        await chatStore.initPromise; // block for 5 seconds
        // Ensure we are using MockChatProvider with specific settings
        await chatStore.setProvider("MOCK", {
            mockDelay: 10,
            responses: ["Streamed Response"],
        });

        // Create a chat to be active
        // We might need to mock storage adapter or ensure that the default one works in test env
        // Assuming default in-memory or indexeddb mock works
        const chatId = await chatStore.createChat("test-char", "Test Chat");
        await chatStore.setActiveChat(chatId);

        // Send message
        const promise = chatStore.sendMessage("Hello");

        // Check for isGenerating state
        expect(chatStore.isGenerating).toBe(true);

        // Wait for it to finish
        await promise;
        expect(chatStore.isGenerating).toBe(false);

        // Check messages
        const messages = chatStore.activeMessages;
        expect(messages.length).toBeGreaterThanOrEqual(2); // User + Assistant

        const assistantMsg = messages.find((m) => m.role === "assistant");
        expect(assistantMsg).toBeDefined();

        const content = assistantMsg?.content;
        expect(content).toBeDefined();

        if (typeof content === "object" && "data" in content) {
            expect(content.data).toBe("Streamed Response");
        } else {
            // Should not happen given we fixed the type
            expect(content).toBe("Streamed Response");
        }
    }, 15000);

    test("abortGeneration stops stream", async () => {
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", {
            mockDelay: 100, // Slow delay
            responses: ["Long Response"],
        });

        const chatId = await chatStore.createChat("test-char-2", "Test Chat 2");
        await chatStore.setActiveChat(chatId);

        const promise = chatStore.sendMessage("Start");

        // Wait a tiny bit to ensure it started
        await new Promise((r) => setTimeout(r, 10));
        expect(chatStore.isGenerating).toBe(true);

        chatStore.abortGeneration();

        await promise;
        expect(chatStore.isGenerating).toBe(false);

        // Check that message might be incomplete or empty depending on when it aborted
        const assistantMsg = chatStore.activeMessages.find((m) => m.role === "assistant");
        // We don't strictly assert content here because timing is flaky, but checking it didn't crash is good.
        expect(assistantMsg).toBeDefined();
    });

    test("regenerateMessage deletes subsequent messages and streams new response", async () => {
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", {
            mockDelay: 10,
            responses: ["Regenerated Content"],
        });

        const chatId = await chatStore.createChat("test-regen", "Regen Chat");
        await chatStore.setActiveChat(chatId);

        // Setup messages: User -> Assistant -> Assistant
        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: "msg-1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId,
            })
        );
        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: "msg-2",
                role: "assistant",
                content: { type: "text", data: "First Response" },
                chatId,
            })
        );
        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: "msg-3",
                role: "assistant",
                content: { type: "text", data: "Second Response" },
                chatId,
            })
        );

        expect(chatStore.activeMessages.length).toBe(3);

        // Regenerate from the first assistant message (msg-2)
        const promise = chatStore.regenerateMessage("msg-2");

        // Should immediately clear from msg-2 onwards in activeMessages
        // Now it should be 1 ([msg-1]) before the new assistant message is added inside try/catch
        expect(chatStore.activeMessages.length).toBe(1);
        expect(chatStore.activeMessages[0].id).toBe("msg-1");

        await promise;

        // Final check: [msg-1, new-assistant-msg]
        expect(chatStore.activeMessages.length).toBe(2);
        expect(chatStore.activeMessages[1].role).toBe("assistant");
        expect(chatStore.activeMessages[1].content.data).toBe("Regenerated Content");
        expect(chatStore.isGenerating).toBe(false);
    });
    test("regenerateMessage re-injects SystemMessage with generation prompt (regression)", async () => {
        // Regression: previously regenerateMessage sent langChainMessages
        // without the SystemMessage, so character/persona/generation prompt
        // were not delivered to the LLM during regeneration.
        await chatStore.initPromise;
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        await chatStore.setProvider("MOCK", { responses: ["Regen Reply"] });

        const chatId = await chatStore.createChat("regen-sys", "Regen Sys");
        await chatStore.setActiveChat(chatId);

        // Seed user + assistant messages
        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: "msg-1",
                role: "user",
                content: { type: "text", data: "Hello" },
                chatId,
            })
        );
        await chatStore.addMessage(
            chatId,
            apply(MessageSchema, {
                id: "msg-2",
                role: "assistant",
                content: { type: "text", data: "First Reply" },
                chatId,
            })
        );

        // Capture messages sent to the provider during regeneration
        const capturedMsgs: { _getType: () => string; content: string }[] = [];
        chatStore["activeProvider"]!.stream = async function* (msgs: BaseMessage[]) {
            for (const m of msgs) {
                if (hasType(m)) capturedMsgs.push(m);
            }
            // Yield the configured mock response inline. We deliberately do
            // NOT delegate to the wrapped MockChatProvider.stream here:
            // under load that path awaits FakeListChatModel's setTimeout,
            // which can stall past the per-test timeout in CI.
            yield "Regen Reply";
        };

        await chatStore.regenerateMessage("msg-2");

        // Verify a SystemMessage was injected with the generation prompt
        const systemMsg = capturedMsgs.find(
            (m) => m._getType() === "system" && m.content.includes("Test system prompt")
        );
        expect(systemMsg).toBeDefined();
        // The SystemMessage should come first (before user message)
        expect(capturedMsgs[0]._getType()).toBe("system");

        // Verify explicit ordering: user message must appear AFTER SystemMessage
        // (Regression defense: ensures baseMessages are appended, not prepended)
        const userIdx = capturedMsgs.findIndex(
            (m) => m._getType() === "human" && m.content === "Hello"
        );
        expect(userIdx).toBeGreaterThan(0);
        expect(capturedMsgs[userIdx].content).toBe("Hello");
    });

    test("error in provider resets isGenerating", async () => {
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", { responses: [] });
        // injecting malicious mock for failure testing
        if (!chatStore["activeProvider"]) {
            throw new Error("Active provider is not set");
        }
        chatStore["activeProvider"] = {
            id: "mock",
            name: "Mock",
            description: "",

            async *stream() {
                // Make this an async generator — the yield satisfies the
                // AsyncGenerator return type required by IChatProvider.
                yield "" as unknown as string;
                throw new Error("Simulated failure");
            },
            abort() {},
            disconnect() {
                throw new Error("Function not implemented.");
            },
            generate(_msg: unknown, _setting?: unknown) {
                throw new Error("Function not implemented.");
            },
            isReady() {
                throw new Error("Function not implemented.");
            },
        } satisfies NonNullable<(typeof chatStore)["activeProvider"]>;

        const chatId = await chatStore.createChat("test-fail", "Test Fail");
        //Suppress Logger.error
        vi.spyOn(Logger, "error").mockImplementationOnce((i) => {
            if (typeof i === "string") {
                if (i.includes("Simulated failure")) return;
            }
            Logger.error(i);
        });
        await chatStore.setActiveChat(chatId);

        await expect(chatStore.sendMessage("Fail me")).rejects.toThrow("Simulated failure");
        expect(chatStore.isGenerating).toBe(false);
    });
    test("system prompt is injected as SystemMessage when generationPrompt is set", async () => {
        await chatStore.initPromise;
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        await chatStore.setProvider("MOCK", { responses: ["Reply"] });

        const chatId = await chatStore.createChat("test-char", "Test System");
        await chatStore.setActiveChat(chatId);

        // Capture messages passed to the provider's stream method
        const capturedMsgs: { _getType: () => string; content: string }[] = [];
        chatStore["activeProvider"]!.stream = async function* (msgs: BaseMessage[]) {
            for (const m of msgs) {
                if (hasType(m)) capturedMsgs.push(m);
            }
            // See regenerateMessage test: avoid FakeListChatModel under load.
            yield "Reply";
        };

        await chatStore.sendMessage("Hello");

        // Verify provider received a SystemMessage as the first message
        expect(capturedMsgs.length).toBeGreaterThanOrEqual(1);
        expect(capturedMsgs[0]._getType()).toBe("system");
        expect(capturedMsgs[0].content).toContain("Test system prompt");

        const userMsg = capturedMsgs.find((m) => m._getType() === "human");
        expect(userMsg).toBeDefined();
    });

    test("empty AI message is removed on provider error", async () => {
        await chatStore.initPromise;
        // Neutralize any leftover provider from prior tests
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        await chatStore.setProvider("MOCK", { responses: [] });

        // Inject a failing provider
        chatStore["activeProvider"] = {
            id: "mock",
            name: "Mock",
            description: "",
            async *stream() {
                yield "";
                throw new Error("Stream failure");
            },
            abort() {},
            async disconnect() {},
            generate() {
                throw new Error("not implemented");
            },
            isReady() {
                return true;
            },
        } satisfies NonNullable<(typeof chatStore)["activeProvider"]>;

        const chatId = await chatStore.createChat("test-err", "Test Err");
        vi.spyOn(Logger, "error").mockImplementationOnce(() => {});
        await chatStore.setActiveChat(chatId);

        await expect(chatStore.sendMessage("Trigger error")).rejects.toThrow();

        const assistantMsgs = chatStore.activeMessages.filter((m) => m.role === "assistant");
        const emptyAssistant = assistantMsgs.filter((m) => {
            const content = m.content;
            return typeof content === "object" && "data" in content && content.data === "";
        });
        expect(emptyAssistant).toHaveLength(0);
        // Also verify: user message still exists (error didn't wipe the conversation)
        const userMsgs = chatStore.activeMessages.filter((m) => m.role === "user");
        expect(userMsgs.length).toBeGreaterThanOrEqual(1);
    });
    test("group chat prefaces response with participant context", async () => {
        await chatStore.initPromise;
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        await chatStore.setProvider("MOCK", { responses: ["Reply"] });
        const { characterStore } =
            await import("@/features/character/stores/characterStore.svelte");
        // apply and CharacterSchema are already imported at the top
        const { CharacterSchema } = await import("@arisutalk/character-spec/v0/Character");
        characterStore.characters.push(
            apply(CharacterSchema, {
                id: "group-char",
                name: "Primary",
                specVersion: 0,
                description: "Primary char",
                prompt: {
                    description: "test",
                    authorsNote: "",
                    lorebook: { config: {}, data: [] },
                },
                executables: {
                    runtimeSetting: { timeout: 30000 },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                assets: { assets: [] },
            })
        );
        characterStore.characters.push(
            apply(CharacterSchema, {
                id: "group-char-2",
                name: "Secondary",
                specVersion: 0,
                description: "Secondary char",
                prompt: {
                    description: "test",
                    authorsNote: "",
                    lorebook: { config: {}, data: [] },
                },
                executables: {
                    runtimeSetting: { timeout: 30000 },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                assets: { assets: [] },
            })
        );
        // Create a group chat with two participants
        const chatId = await chatStore.createChat("group-char", "Group Chat");
        const created = chatStore.chats.find((c) => c.id === chatId);
        if (created) {
            created.chatType = "group";
            created.participantIds = ["group-char", "group-char-2"];
        }
        await chatStore.setActiveChat(chatId);

        // Capture messages passed to the provider
        const capturedMsgs: { _getType: () => string; content: string }[] = [];
        chatStore["activeProvider"]!.stream = async function* (msgs: BaseMessage[]) {
            for (const m of msgs) {
                if (hasType(m)) capturedMsgs.push(m);
            }
            // Yield inline to avoid FakeListChatModel.setTimeout under load.
            yield "Reply";
        };

        await chatStore.sendMessage("Hello group");

        // Verify provider received a context HumanMessage with participant names
        const contextMsg = capturedMsgs.find(
            (m) => m._getType() === "human" && m.content.includes("[Context:")
        );
        expect(contextMsg).toBeDefined();
        // Stronger structural checks (vs weak substring "group" which is in the format string)
        expect(contextMsg?.content).toContain("Primary character:");
        expect(contextMsg?.content).toContain("Other participants:");
        expect(contextMsg?.content).toContain("Primary");
        expect(contextMsg?.content).toContain("Secondary");

        // Positioning: SystemMessage is at index 0, context at index 1, user at index 2+
        // (Regression defense: context must be prepended, not appended)
        expect(capturedMsgs[0]._getType()).toBe("system");
        expect(capturedMsgs[1]._getType()).toBe("human");
        expect(capturedMsgs[1].content).toContain("[Context:");
        // The actual user message should come after the context
        const userIdx = capturedMsgs.findIndex(
            (m) => m._getType() === "human" && m.content === "Hello group"
        );
        expect(userIdx).toBeGreaterThan(1);
    });
    test("Mock fallback when no LLM config exists", async () => {
        // Mock settings has llmConfigs: [] and activeLLMConfigId: null.
        // loadProviderFromSettings should fall back to Mock when no config exists.
        await chatStore.initPromise;
        // Neutralize any leftover provider (especially the broken one from the error test)
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        // Call loadProviderFromSettings directly — should fallback to Mock (no configs in mock settings)
        await chatStore.loadProviderFromSettings();

        const chatId = await chatStore.createChat("test-char", "Mock Fallback");
        await chatStore.setActiveChat(chatId);

        const promise = chatStore.sendMessage("Hello from fallback");
        expect(chatStore.isGenerating).toBe(true);
        await promise;
        expect(chatStore.isGenerating).toBe(false);

        const messages = chatStore.activeMessages;
        expect(messages.length).toBeGreaterThanOrEqual(2);
        const assistantMsg = messages.find((m) => m.role === "assistant");
        expect(assistantMsg).toBeDefined();
    });

    test("getNextTimestamp produces monotonic values", async () => {
        await chatStore.initPromise;
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        await chatStore.setProvider("MOCK", { responses: ["Reply 1"] });

        const chatId = await chatStore.createChat("ts-char", "TS Test");
        await chatStore.setActiveChat(chatId);

        await chatStore.sendMessage("First");
        const firstAssistant = chatStore.activeMessages.find((m) => m.role === "assistant");
        expect(firstAssistant).toBeDefined();
        const ts1 = firstAssistant!.timestamp;

        // Second message — reply content differs so provider won't reject identical input
        await chatStore.setProvider("MOCK", { responses: ["Reply 2"] });
        await chatStore.sendMessage("Second");
        const secondAssistant = chatStore.activeMessages.filter((m) => m.role === "assistant");
        expect(secondAssistant.length).toBeGreaterThanOrEqual(2);
        const ts2 = secondAssistant[secondAssistant.length - 1].timestamp;
        expect(ts2).toBeGreaterThan(ts1);
    });

    test("deleteMessage removes a message from activeMessages", async () => {
        await chatStore.initPromise;
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        await chatStore.setProvider("MOCK", { responses: ["Reply"] });

        const chatId = await chatStore.createChat("del-char", "Delete Test");
        await chatStore.setActiveChat(chatId);
        await chatStore.sendMessage("Hello");

        const userMsg = chatStore.activeMessages.find((m) => m.role === "user");
        expect(userMsg).toBeDefined();
        const msgId = userMsg!.id;

        await chatStore.deleteMessage(msgId);

        const deleted = chatStore.activeMessages.find((m) => m.id === msgId);
        expect(deleted).toBeUndefined();
    });
});
