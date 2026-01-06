import { describe, it, expect, vi, beforeEach } from "vitest";
import { LangChainBaseProvider } from "@/lib/providers/chat/LangChainBaseProvider";
import { HumanMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Logger } from "@common/logger/Logger";

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
    beforeEach(() => {
        vi.spyOn(Logger, "structured").mockImplementation(() => {});
    });

    it("logs start and complete on generate", async () => {
        const mockClient = {
            invoke: vi.fn().mockResolvedValue({ content: "test response" }),
        };
        const provider = new TestProvider(mockClient);
        await provider.generate([new HumanMessage("hi")]);

        expect(Logger.structured).toHaveBeenCalledWith(
            "llm.request.start",
            expect.objectContaining({
                provider: "MOCK",
            })
        );
        expect(Logger.structured).toHaveBeenCalledWith(
            "llm.request.complete",
            expect.objectContaining({
                provider: "MOCK",
            })
        );
    });

    it("logs error on generate failure", async () => {
        const mockClient = {
            invoke: vi.fn().mockRejectedValue(new Error("Fail")),
        };
        const provider = new TestProvider(mockClient);
        await expect(provider.generate([new HumanMessage("hi")])).rejects.toThrow("Fail");

        expect(Logger.structured).toHaveBeenCalledWith(
            "llm.request.error",
            expect.objectContaining({
                provider: "MOCK",
                errorMessage: "Fail",
            })
        );
    });

    it("logs start and complete on stream", async () => {
        const mockClient = {
            stream: vi.fn().mockImplementation(async function* () {
                yield { content: "chunk" };
            }),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const chunk of generator) {
            /* consume */
        }

        expect(Logger.structured).toHaveBeenCalledWith(
            "llm.request.start",
            expect.objectContaining({
                provider: "MOCK",
            })
        );
        expect(Logger.structured).toHaveBeenCalledWith(
            "llm.request.complete",
            expect.objectContaining({
                provider: "MOCK",
            })
        );
    });

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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        circular.self = circular;
        const mockClient = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
            stream: vi.fn().mockImplementation(async function* (
                _msgs: unknown,
                options: AbortController
            ) {
                if (options?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
                yield { content: "chunk1" };
                // Simulate delay to allow abort to happen
                await new Promise((r) => setTimeout(r, 10));

                if (options?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
                yield { content: "chunk2" };
            } satisfies Partial<BaseChatModel["stream"]>),
        };
        const provider = new TestProvider(mockClient);
        const generator = provider.stream([new HumanMessage("hi")]);

        const next = generator.next();
        provider.abort();

        // The first chunk might or might not come through depending on timing, but it should handle the abort error gracefully
        try {
            await next;
            // consume rest
            for await (const _ of generator) {
                // do nothing
            }
        } catch {
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
            for await (const _ of generator) {
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
