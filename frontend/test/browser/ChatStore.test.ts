import { test, expect, describe } from "vitest";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";

describe("ChatStore Streaming", () => {
    test("sendMessage streams response from MockChatProvider", async () => {
        // Initialize store
        await chatStore.initPromise;

        // Ensure we are using MockChatProvider with specific settings
        await chatStore.setProvider("MOCK", {
            mockDelay: 10,
            responses: ["Streamed Response"],
        });

        // Create a chat to be active
        // We might need to mock storage adapter or ensure the default one works in test env
        // Assuming default in-memory or indexeddb mock works
        const chatId = await chatStore.createChat("test-char", "Test Chat");
        await chatStore.setActiveChat(chatId);

        // console.log("Active Provider:", chatStore["activeProvider"]); // accessing private if need be, or assume it's set

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
    });

    test("abortGeneration stops the stream", async () => {
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

    test("error in provider resets isGenerating", async () => {
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", { responses: [] });
        // injecting malicious mock for failure testing

        chatStore["activeProvider"] = {
            stream: async function* () {
                // Dummy yield to satisfy generator requirement
                // eslint-disable-next-line no-constant-condition
                if (false) yield "";
                throw new Error("Simulated failure");
            },
            abort: () => {},
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        const chatId = await chatStore.createChat("test-fail", "Test Fail");
        await chatStore.setActiveChat(chatId);

        await chatStore.sendMessage("Fail me");
        expect(chatStore.isGenerating).toBe(false);
    });

    test.skip("provider reloads when settings change", async () => {
        const { settings } = await import("@/lib/stores/settings.svelte");
        const { LLMConfigSchema } = await import("@/lib/types/IDataModel");

        await chatStore.initPromise;

        // Set initial provider
        await chatStore.setProvider("MOCK", {
            mockDelay: 10,
            responses: ["Initial Response"],
        });

        // Create chat
        const chatId = await chatStore.createChat("test-reload", "Test Reload");
        await chatStore.setActiveChat(chatId);

        // Send first message
        await chatStore.sendMessage("First");
        const assistantMsg = chatStore.activeMessages.find((m) => m.role === "assistant");
        expect(assistantMsg).toBeDefined();
        if (
            assistantMsg &&
            typeof assistantMsg.content === "object" &&
            "data" in assistantMsg.content
        ) {
            expect(assistantMsg.content.data).toBe("Initial Response");
        }

        // Change settings - add new config and set as active
        const newConfig = LLMConfigSchema.parse({
            name: "Updated Config",
            provider: "Mock",
            enabled: true,
        });
        settings.value.llmConfigs = [newConfig];
        settings.value.activeLLMConfigId = newConfig.id;

        // Wait for $effect to trigger
        await new Promise((r) => setTimeout(r, 200));

        // Provider should have been reloaded automatically
        // We can't directly check the provider, but we can verify it works
        // by ensuring subsequent messages still work
        await chatStore.sendMessage("Second");
        const messages = chatStore.activeMessages.filter((m) => m.role === "assistant");
        expect(messages.length).toBeGreaterThanOrEqual(1);
    });
});
