import { describe, it, expect } from "vitest";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { CommonChatSettings } from "@/lib/interfaces";
import { HumanMessage } from "@langchain/core/messages";

// If exists, run the test
const API_KEY = import.meta.env.GEMINI_API_KEY;

describe.runIf(API_KEY)("Gemini Real API Integration", () => {
    const commonSettings: CommonChatSettings = {
        apiKey: API_KEY,
        model: "gemini-flash-lite-latest",
    };

    const geminiSettings = {
        safetySettings: [],
    };

    it("connects with real API key and generating response", async () => {
        try {
            const provider = await GeminiChatProvider.factory.connect({
                ...commonSettings,
                ...geminiSettings,
            });
            expect(provider).toBeInstanceOf(GeminiChatProvider);

            const response = await provider.generate([
                new HumanMessage("Say 'Hello Integration Test'"),
            ]);

            console.log("Real API Response:", response);
            expect(response).toBeTruthy();
            expect(typeof response).toBe("string");
            expect(response.length).toBeGreaterThan(0);
        } catch (error) {
            console.error("Real API Test Failed:", error);
            throw error; // Fail the test
        }
    }, 30000); // Increased timeout for real network request
});
