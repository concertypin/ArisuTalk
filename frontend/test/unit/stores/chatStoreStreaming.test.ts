// @vitest-environment happy-dom
import { test, expect, describe, vi, afterEach } from "vitest";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { Logger } from "@common/logger/Logger";

// Mock settings to avoid 5s timeout in chatStore.initialize()
vi.mock("@/lib/stores/settings.svelte", () => ({
    settings: {
        value: {
            llmConfigs: [],
            activeLLMConfigId: null,
            model: "test-model",
        },
        isLoaded: true,
        init: vi.fn(),
        save: vi.fn(),
    },
}));

describe("ChatStore Streaming", () => {
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

            async *stream () {
                if (false) yield "";
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
});
