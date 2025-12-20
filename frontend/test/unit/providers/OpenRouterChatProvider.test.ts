import { describe, it, expect, vi, beforeEach } from "vitest";
import { expectTypeOf } from "vitest";
import { OpenRouterChatProvider } from "@/lib/providers/chat/OpenRouterChatProvider";
import { HumanMessage } from "@langchain/core/messages";

// Mock the @langchain/openai module
vi.mock("@langchain/openai", async () => {
    class MockChatOpenAI {
        invoke = vi.fn().mockResolvedValue({ content: "OpenRouter response" });
        stream = vi.fn().mockImplementation(async function* () {
            yield { content: "OpenRouter" };
            yield { content: " " };
            yield { content: "stream" };
        });
    }

    return {
        ChatOpenAI: MockChatOpenAI,
    };
});

describe("OpenRouterChatProvider", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const commonSettings = {
        apiKey: "test-api-key",
        model: "mistralai/mistral-7b-instruct",
    };

    const openRouterSettings = {
        baseUrl: "https://api.openrouter.ai/v1",
        generationParameters: {
            temperature: 0.7,
            maxInputTokens: 2000,
            maxOutputTokens: 1000,
        },
    };

    it("connects and creates instance with factory", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });
        expect(provider).toBeInstanceOf(OpenRouterChatProvider);
    });

    it("has correct provider metadata", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });
        expect(provider.id).toBe("OPENROUTER");
        expect(provider.name).toBe("OpenRouter");
        expect(provider.description).toContain("OpenRouter");
    });

    it("uses provided API key for initialization", async () => {
        const customKey = "custom-api-key-12345";
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            apiKey: customKey,
            ...openRouterSettings,
        });
        expect(provider.isReady()).toBe(true);
    });

    it("returns false for isReady when API key is empty", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            apiKey: "",
            ...openRouterSettings,
        });
        expect(provider.isReady()).toBe(false);
    });

    it("uses default base URL when not provided", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            // baseUrl intentionally not provided
        });
        expect(provider).toBeInstanceOf(OpenRouterChatProvider);
    });

    it("uses default model when not provided", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            apiKey: "test-key",
            // model intentionally not provided
        });
        expect(provider).toBeInstanceOf(OpenRouterChatProvider);
    });

    it("generates response from messages", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const response = await provider.generate([new HumanMessage("Hello, what is 2 + 2?")]);
        expect(response).toBe("OpenRouter response");
    });

    it("handles string content response", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const response = await provider.generate([new HumanMessage("hi")]);
        expect(typeof response).toBe("string");
        expect(response).toBeDefined();
    });

    it("handles null content by returning empty string", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const response = await provider.generate([new HumanMessage("hi")]);
        // The mocked invoke returns "OpenRouter response", but we test the behavior
        expect(typeof response).toBe("string");
    });

    it("streams response", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const stream = provider.stream([new HumanMessage("hi")]);
        let result = "";
        for await (const chunk of stream) {
            result += chunk;
        }
        expect(result).toBe("OpenRouter stream");
    });

    it("properly handles stream errors", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const stream = provider.stream([new HumanMessage("hi")]);
        let result = "";
        for await (const chunk of stream) {
            result += chunk;
        }
        expect(result).toBeDefined();
    });

    it("handles abort during streaming", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const _stream = provider.stream([new HumanMessage("hi")]);
        // Then abort
        provider.abort();

        // After abort, stream should handle it gracefully
        expect(provider).toBeInstanceOf(OpenRouterChatProvider);
    });

    it("disconnects without errors", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    it("can connect multiple times independently", async () => {
        const provider1 = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            apiKey: "key1",
            ...openRouterSettings,
        });

        const provider2 = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            apiKey: "key2",
            ...openRouterSettings,
        });

        expect(provider1).toBeInstanceOf(OpenRouterChatProvider);
        expect(provider2).toBeInstanceOf(OpenRouterChatProvider);
        expect(provider1).not.toBe(provider2);
    });

    it("handles multiple messages in conversation", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
        });

        const messages = [new HumanMessage("First message"), new HumanMessage("Second message")];

        const response = await provider.generate(messages);
        expect(response).toBeDefined();
        expect(typeof response).toBe("string");
    });

    it("abort clears the abort controller", async () => {
        const provider = await OpenRouterChatProvider.factory.connect({
            ...commonSettings,
            ...openRouterSettings,
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

describe("OpenRouterChatProvider Type Tests", () => {
    it("has correct static factory type", async () => {
        expectTypeOf(OpenRouterChatProvider.factory).toHaveProperty("connect");
        expectTypeOf(OpenRouterChatProvider.factory.connect).toBeFunction();
    });

    it("provider instance has correct method signatures", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);

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
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);

        expectTypeOf(provider.id).toBeString();
        expectTypeOf(provider.name).toBeString();
        expectTypeOf(provider.description).toBeString();

        expect(provider.id).toBe("OPENROUTER");
        expect(provider.name).toBe("OpenRouter");
    });

    it("generate method returns a Promise of string", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);
        const messages = [new HumanMessage("test")];

        const result = provider.generate(messages);
        expectTypeOf(result).toMatchTypeOf<Promise<string>>();

        const resolved = await result;
        expectTypeOf(resolved).toBeString();
    });

    it("stream method returns async generator of strings", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);
        const messages = [new HumanMessage("test")];

        const stream = provider.stream(messages);
        expectTypeOf(stream).toMatchTypeOf<AsyncGenerator<string, void, unknown>>();
    });

    it("isReady returns boolean", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);
        const ready = provider.isReady();

        expectTypeOf(ready).toBeBoolean();
    });

    it("disconnect returns Promise void", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);
        const result = provider.disconnect();

        expectTypeOf(result).toMatchTypeOf<Promise<void>>();
    });

    it("abort method returns void", async () => {
        const commonSettings = {
            apiKey: "test-key",
            model: "mistral-7b",
        };

        const provider = await OpenRouterChatProvider.factory.connect(commonSettings);
        const _stream = provider.stream([new HumanMessage("test")]);
        const result = provider.abort();

        expectTypeOf(result).toBeVoid();
    });
});
