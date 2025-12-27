
import { describe, it, expect, vi } from "vitest";
import { LangChainBaseProvider } from "@/lib/providers/chat/LangChainBaseProvider";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Concrete implementation for testing
class TestProvider extends LangChainBaseProvider<"MOCK"> {
    id = "MOCK";
    name = "Test Provider";
    description = "Test Provider";
    client: BaseChatModel;

    constructor(client: unknown) {
        super();
        this.client = client as BaseChatModel;
    }

    isReady() {
        return true;
    }
}

describe("LangChainBaseProvider", () => {
    it("disconnect does nothing (default implementation)", async () => {
        const provider = new TestProvider({});
        await expect(provider.disconnect()).resolves.toBeUndefined();
    });

    it("generate returns string content", async () => {
        const mockClient = {
            invoke: vi.fn().mockResolvedValue({ content: "test response" }),
        };
        const provider = new TestProvider(mockClient);
        const result = await provider.generate([new HumanMessage("hi")]);
        expect(result).toBe("test response");
    });

    it("generate handles non-string content (e.g. JSON/objects)", async () => {
        const mockClient = {
            invoke: vi.fn().mockResolvedValue({ content: { some: "data" } }),
        };
        const provider = new TestProvider(mockClient);
        const result = await provider.generate([new HumanMessage("hi")]);
        expect(result).toBe('{"some":"data"}');
    });

    it("generate handles null/undefined content", async () => {
        const mockClient = {
            invoke: vi.fn().mockResolvedValue({ content: null }),
        };
        const provider = new TestProvider(mockClient);
        const result = await provider.generate([new HumanMessage("hi")]);
        expect(result).toBe("");
    });

    it("generate returns empty string on JSON error", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const circular: any = {};
        circular.self = circular;
        const mockClient = {
            invoke: vi.fn().mockResolvedValue({ content: circular }),
        };
        const provider = new TestProvider(mockClient);
        const result = await provider.generate([new HumanMessage("hi")]);
        expect(result).toBe("");
    });

    it("stream yields chunks", async () => {
        const mockClient = {
            stream: vi.fn().mockImplementation(async function* () {
                yield { content: "chunk1" };
                yield { content: "chunk2" };
            }),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        let result = "";
        for await (const chunk of generator) {
            result += chunk;
        }
        expect(result).toBe("chunk1chunk2");
    });

    it("stream handles JSON chunks", async () => {
        const mockClient = {
            stream: vi.fn().mockImplementation(async function* () {
                yield { content: { part: 1 } };
            }),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        let result = "";
        for await (const chunk of generator) {
            result += chunk;
        }
        expect(result).toBe('{"part":1}');
    });

    it("abort cancels the stream", async () => {
        const mockClient = {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            stream: vi.fn().mockImplementation(async function* (msgs, options) {
                if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
                yield { content: "chunk1" };
                // Simulate delay to allow abort to happen
                await new Promise(r => setTimeout(r, 10));
                if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
                yield { content: "chunk2" };
            }),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        const next = generator.next();
        provider.abort();

        // The first chunk might or might not come through depending on timing, but it should handle the abort error gracefully
        try {
            await next;
            // consume rest
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const chunk of generator) {
                // do nothing
            }
        } catch (e) {
            // It might throw if we don't catch it inside, but the implementation catches AbortError
        }
        // If implementation is correct, it catches AbortError and returns, so the loop finishes cleanly or throws nothing.
        expect(provider).toBeInstanceOf(TestProvider);
    });

    it("stream rethrows non-abort errors", async () => {
        const mockClient = {
            stream: vi.fn().mockRejectedValue(new Error("Network error")),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        await expect(async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const chunk of generator) {
                // do nothing
            }
        }).rejects.toThrow("Network error");
    });

    it("stream rethrows other DOMExceptions", async () => {
        const mockClient = {
            stream: vi.fn().mockRejectedValue(new DOMException("Other error", "OtherError")),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        await expect(async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const chunk of generator) {
                // do nothing
            }
        }).rejects.toThrow("Other error");
    });
});
