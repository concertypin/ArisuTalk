import { describe, it, expect } from "vitest";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";
import { CommonChatSettings } from "@/lib/interfaces";
import { HumanMessage } from "@langchain/core/messages";

describe("MockChatProvider", () => {
    const commonSettings: CommonChatSettings = {
        apiKey: "mock-key",
        model: "mock-model",
    };

    const mockSettings = {
        mockDelay: 2,
        responses: ["Mock response 1", "Mock response 2"],
    };

    it("connects and creates instance", async () => {
        const provider = await MockChatProvider.factory.connect({
            ...commonSettings,
            ...mockSettings,
        });
        expect(provider).toBeInstanceOf(MockChatProvider);
    });

    it("uses configured responses in order", async () => {
        const provider = await MockChatProvider.factory.connect({
            ...commonSettings,
            ...mockSettings,
        });

        // First response
        const r1 = await provider.generate([new HumanMessage("hi")]);
        expect(r1).toBe("Mock response 1");

        // Second response
        const r2 = await provider.generate([new HumanMessage("hi again")]);
        expect(r2).toBe("Mock response 2");

        // Loop back to first
        const r3 = await provider.generate([new HumanMessage("hi again again")]);
        expect(r3).toBe("Mock response 1");
    });

    it("streams response", async () => {
        const provider = await MockChatProvider.factory.connect({
            ...commonSettings,
            mockDelay: 0,
            responses: ["Stream"],
        });

        const stream = provider.stream([new HumanMessage("hi")]);
        let result = "";
        for await (const chunk of stream) {
            result += chunk;
        }
        expect(result).toBe("Stream");
    });
});
