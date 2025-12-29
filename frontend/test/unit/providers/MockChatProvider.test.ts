import { describe, it, expect, expectTypeOf } from "vitest";
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

    it("has correct metadata", async () => {
        const provider = await MockChatProvider.factory.connect({ ...commonSettings });
        expect(provider.id).toBe("MOCK");
        expect(provider.name).toBe("Mock Provider");
        expect(provider.description).toBe("Mock provider for testing");
    });

    it("is always ready", async () => {
        const provider = await MockChatProvider.factory.connect({ ...commonSettings });
        expect(provider.isReady()).toBe(true);
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

    it("handles abort", async () => {
        const provider = await MockChatProvider.factory.connect({
            ...commonSettings,
            mockDelay: 10,
            responses: ["Long response"],
        });

        const stream = provider.stream([new HumanMessage("hi")]);

        // Start consumption
        const next = stream.next();

        // Abort
        provider.abort();

        await next;

        expect(provider).toBeInstanceOf(MockChatProvider);
    });

    it("disconnect does nothing", async () => {
        const provider = await MockChatProvider.factory.connect(commonSettings);
        await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    it("uses default settings if not provided", async () => {
        const provider = await MockChatProvider.factory.connect(commonSettings);
        const response = await provider.generate([new HumanMessage("hi")]);
        expect(response).toBe("Hello!"); // Default first response
    });

    it("factory connect has correct type", () => {
        expectTypeOf(MockChatProvider.factory.connect).toBeFunction();
    });
});
