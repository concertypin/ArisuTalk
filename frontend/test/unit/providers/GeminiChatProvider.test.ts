
import { describe, it, expect, vi } from "vitest";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { CommonChatSettings } from "@/lib/interfaces";
import { HumanMessage } from "@langchain/core/messages";

// Mock the dynamic import of @langchain/google-genai
vi.mock("@langchain/google-genai", async () => {
    class MockClass {
        config: unknown;
        constructor(config: unknown) {
            this.config = config;
        }
        invoke = vi.fn().mockResolvedValue({ content: "Mocked response" });
        stream = vi.fn().mockImplementation(async function* () {
            yield { content: "Mocked", text: "Mocked" };
            yield { content: " ", text: " " };
            yield { content: "stream", text: "stream" };
        });
    }
    return {
        __esModule: true,
        ChatGoogleGenerativeAI: MockClass,
        default: { ChatGoogleGenerativeAI: MockClass },
    };
});

describe("GeminiChatProvider", () => {
    const commonSettings: CommonChatSettings = {
        apiKey: "test-key",
        model: "gemini-pro",
    };

    const geminiSettings = {
        safetySettings: [],
    };

    it("connects and creates instance", async () => {
        const provider = await GeminiChatProvider.factory.connect({
            ...commonSettings,
            ...geminiSettings,
        });
        expect(provider).toBeInstanceOf(GeminiChatProvider);
        expect(provider.isReady()).toBe(true);
    });

    it("generates response", async () => {
        const provider = await GeminiChatProvider.factory.connect({
            ...commonSettings,
            ...geminiSettings,
        });

        const response = await provider.generate([new HumanMessage("hi")]);
        expect(response).toBe("Mocked response");
    });

    it("streams response", async () => {
        const provider = await GeminiChatProvider.factory.connect({
            ...commonSettings,
            ...geminiSettings,
        });

        const stream = provider.stream([new HumanMessage("hi")]);
        let result = "";
        for await (const chunk of stream) {
            result += chunk;
        }
        expect(result).toBe("Mocked stream");
    });

    it("throws error if model is not specified", async () => {
        const settings = { ...commonSettings, model: undefined };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await expect(GeminiChatProvider.factory.connect(settings as any)).rejects.toThrow("Model must be specified for GeminiChatProvider.");
    });

    it("handles thinkingLevel string configuration", async () => {
        const settings = {
            ...commonSettings,
            ...geminiSettings,
            generationParameters: {
                thinkingLevel: "high",
            },
        };
        const provider = await GeminiChatProvider.factory.connect(settings);
        expect(provider).toBeInstanceOf(GeminiChatProvider);
    });

    it("handles thinkingLevel number configuration", async () => {
        const settings = {
            ...commonSettings,
            ...geminiSettings,
            generationParameters: {
                thinkingLevel: 1000,
            },
        };
        const provider = await GeminiChatProvider.factory.connect(settings);
        expect(provider).toBeInstanceOf(GeminiChatProvider);
    });

    it("handles default thinking configuration", async () => {
        const settings = {
            ...commonSettings,
            ...geminiSettings,
            generationParameters: {
                thinkingLevel: undefined,
            },
        };
        const provider = await GeminiChatProvider.factory.connect(settings);
        expect(provider).toBeInstanceOf(GeminiChatProvider);
    });

    it("handles safety settings mapping", async () => {
        const settings = {
            ...commonSettings,
            ...geminiSettings,
            safetySettings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_LOW_AND_ABOVE" }
            ],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = await GeminiChatProvider.factory.connect(settings as any);
        expect(provider).toBeInstanceOf(GeminiChatProvider);
    });
});
