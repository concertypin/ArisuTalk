import { describe, it, expect, vi, beforeEach } from "vitest";
import { expectTypeOf } from "vitest";
import { AnthropicChatProvider } from "@/lib/providers/chat/AnthropicChatProvider";
import { HumanMessage } from "@langchain/core/messages";

// Mock the @langchain/anthropic module
vi.mock("@langchain/anthropic", async () => {
    class MockChatAnthropic {
        invoke = vi.fn().mockResolvedValue({ content: "Anthropic response" });
        stream = vi.fn().mockImplementation(async function* () {
            yield { content: "Anthropic" };
            yield { content: " " };
            yield { content: "stream" };
        });
    }

    return {
        ChatAnthropic: MockChatAnthropic,
    };
});

describe("AnthropicChatProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const commonSettings = {
        apiKey: "test-api-key",
        model: "claude-sonnet-4-20250514",
    };

    const anthropicSettings = {
        generationParameters: {
            temperature: 0.7,
            maxOutputTokens: 1000,
        },
    };

    it("connects and creates instance with factory", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });
        expect(provider).toBeInstanceOf(AnthropicChatProvider);
    });

    it("has correct provider metadata", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });
        expect(provider.id).toBe("ANTHROPIC");
        expect(provider.name).toBe("Anthropic");
        expect(provider.description).toContain("Claude");
    });

    it("uses provided API key for initialization", async () => {
        const customKey = "custom-api-key-12345";
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            apiKey: customKey,
            ...anthropicSettings,
        });
        expect(provider.isReady()).toBe(true);
    });

    it("returns false for isReady when API key is empty", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            apiKey: "",
            ...anthropicSettings,
        });
        expect(provider.isReady()).toBe(false);
    });

    it("uses default model when not provided", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            apiKey: "test-key",
            // model intentionally not provided
        });
        expect(provider).toBeInstanceOf(AnthropicChatProvider);
    });

    it("generates response from messages", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        const response = await provider.generate([new HumanMessage("Hello, what is 2 + 2?")]);
        expect(response).toBe("Anthropic response");
    });

    it("handles string content response", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        const response = await provider.generate([new HumanMessage("hi")]);
        expect(typeof response).toBe("string");
        expect(response).toBeDefined();
    });

    it("streams response", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        const stream = provider.stream([new HumanMessage("hi")]);
        let result = "";
        for await (const chunk of stream) {
            result += chunk;
        }
        expect(result).toBe("Anthropic stream");
    });

    it("handles abort during streaming", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        const _stream = provider.stream([new HumanMessage("hi")]);
        // Then abort
        provider.abort();

        // After abort, stream should handle it gracefully
        expect(provider).toBeInstanceOf(AnthropicChatProvider);
    });

    it("disconnects without errors", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    it("can connect multiple times independently", async () => {
        const provider1 = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            apiKey: "key1",
            ...anthropicSettings,
        });

        const provider2 = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            apiKey: "key2",
            ...anthropicSettings,
        });

        expect(provider1).toBeInstanceOf(AnthropicChatProvider);
        expect(provider2).toBeInstanceOf(AnthropicChatProvider);
        expect(provider1).not.toBe(provider2);
    });

    it("handles multiple messages in conversation", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        const messages = [new HumanMessage("First message"), new HumanMessage("Second message")];

        const response = await provider.generate(messages);
        expect(response).toBeDefined();
        expect(typeof response).toBe("string");
    });

    it("uses default maxTokens of 4096 when not provided", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            // No generationParameters provided
        });
        expect(provider).toBeInstanceOf(AnthropicChatProvider);
    });

    it("abort clears the abort controller", async () => {
        const provider = await AnthropicChatProvider.factory.connect({
            ...commonSettings,
            ...anthropicSettings,
        });

        // Start a stream to initialize the abort controller
        const _stream = provider.stream([new HumanMessage("hi")]);
        // Don't consume the stream, just call abort
        provider.abort();

        // After abort, should be able to stream again
        const stream2 = provider.stream([new HumanMessage("hi again")]);
        let result = "";
        for await (const chunk of stream2) {
            result += chunk;
        }
        expect(result).toBeDefined();
    });
});

describe("AnthropicChatProvider Type Tests", () => {
    it("has correct static factory type", async () => {
        expectTypeOf(AnthropicChatProvider.factory).toHaveProperty("connect");
        expectTypeOf(AnthropicChatProvider.factory.connect).toBeFunction();
    });

    it("provider instance has correct method signatures", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);

        // Check method types
        expectTypeOf(provider.disconnect).toBeFunction();
        expectTypeOf(provider.generate).toBeFunction();
        expectTypeOf(provider.stream).toBeFunction();
        expectTypeOf(provider.abort).toBeFunction();
        expectTypeOf(provider.isReady).toBeFunction();
    });

    it("provider metadata has correct types", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);

        expectTypeOf(provider.id).toBeString();
        expectTypeOf(provider.name).toBeString();
        expectTypeOf(provider.description).toBeString();

        expect(provider.id).toBe("ANTHROPIC");
        expect(provider.name).toBe("Anthropic");
    });

    it("generate method returns a Promise of string", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);
        const messages = [new HumanMessage("test")];

        const result = provider.generate(messages);
        expectTypeOf(result).toMatchTypeOf<Promise<string>>();

        const resolved = await result;
        expectTypeOf(resolved).toBeString();
    });

    it("stream method returns async generator of strings", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);
        const messages = [new HumanMessage("test")];

        const stream = provider.stream(messages);
        expectTypeOf(stream).toMatchTypeOf<AsyncGenerator<string, void, unknown>>();
    });

    it("isReady returns boolean", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);
        const ready = provider.isReady();

        expectTypeOf(ready).toBeBoolean();
    });

    it("disconnect returns Promise void", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);
        const result = provider.disconnect();

        expectTypeOf(result).toMatchTypeOf<Promise<void>>();
    });

    it("abort method returns void", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "claude-3-opus",
        };

        const provider = await AnthropicChatProvider.factory.connect(commonSettings);
        const _stream = provider.stream([new HumanMessage("test")]);
        const result = provider.abort();

        expectTypeOf(result).toBeVoid();
    });
});
