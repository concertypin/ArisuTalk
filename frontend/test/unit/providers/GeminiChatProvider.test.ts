import { describe, it, expect, vi } from "vitest";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { CommonChatSettings } from "@/lib/interfaces";
import { HumanMessage } from "@langchain/core/messages";

// Mock the dynamic import of @langchain/google-genai
vi.mock("@langchain/google-genai", async () => {
    class MockClass {
        constructor() {}
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
});
