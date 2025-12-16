import { describe, it, expect } from "vitest";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { CommonChatSettings } from "@/lib/interfaces";
import { HumanMessage } from "@langchain/core/messages";

const API_KEY = import.meta.env.GEMINI_API_KEY as string | undefined;

describe("Gemini Real API Integration", () => {
    // Skip if no API key
    if (!API_KEY) {
        it.skip("skips real API test because GEMINI_API_KEY is missing", () => {});
        return;
    }

    const commonSettings: CommonChatSettings = {
        apiKey: API_KEY,
        model: "gemini-flash-lite-latest",
    };

    const geminiSettings = {
        safetySettings: [],
    };

    it("connects with real API key and generating response", async () => {
        console.log("Running real API test with model:", commonSettings.model);

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
