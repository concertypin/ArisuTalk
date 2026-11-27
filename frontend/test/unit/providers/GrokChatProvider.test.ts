/**
 * @fileoverview Tests for the Grok (xAI) provider: how settings map to the OpenAI-compatible
 * LangChain client, and that generation goes through that client. The client is replaced by a
 * recording fake, so no request leaves the test.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { GrokChatProvider } from "@/lib/providers/chat/GrokChatProvider";

type ClientOptions = {
    model?: string;
    temperature?: number;
    streaming?: boolean;
    apiKey?: string;
    maxTokens?: number;
    maxCompletionTokens?: number;
    configuration?: { baseURL?: string; dangerouslyAllowBrowser?: boolean };
};

const { constructed, invokeMock } = vi.hoisted(() => {
    const options: unknown[] = [];
    const invoke = vi.fn<(messages: unknown[]) => Promise<{ content: string }>>();
    return { constructed: options, invokeMock: invoke };
});

vi.mock("@langchain/openai", () => ({
    ChatOpenAI: class {
        constructor(options: unknown) {
            constructed.push(options);
        }
        invoke = invokeMock;
    },
}));

/** The options the provider passed to the most recently constructed client. */
function lastClientOptions(): ClientOptions {
    const options: unknown = constructed.at(-1);
    if (typeof options !== "object" || options === null) {
        throw new Error("ChatOpenAI was not constructed");
    }
    return options;
}

describe("GrokChatProvider", () => {
    beforeEach(() => {
        constructed.length = 0;
        invokeMock.mockReset();
    });

    it("identifies itself as the Grok provider", async () => {
        const provider = await GrokChatProvider.factory.connect({ apiKey: "xai-key" });
        expect(provider).toBeInstanceOf(GrokChatProvider);
        expect(provider.id).toBe("GROK");
        expect(provider.name).toBe("Grok");
        expect(provider.description).toContain("xAI");
    });

    it("points the client at api.x.ai with the default model and browser access enabled", async () => {
        await GrokChatProvider.factory.connect({ apiKey: "xai-key" });
        const options = lastClientOptions();
        expect(options.model).toBe("grok-3-mini");
        expect(options.configuration?.baseURL).toBe("https://api.x.ai/v1");
        expect(options.configuration?.dangerouslyAllowBrowser).toBe(true);
        expect(options.apiKey).toBe("xai-key");
        expect(options.streaming).toBe(true);
    });

    it("uses the configured model and base URL instead of the defaults", async () => {
        await GrokChatProvider.factory.connect({
            apiKey: "xai-key",
            model: "grok-4",
            baseURL: "https://proxy.example/v1",
        });
        const options = lastClientOptions();
        expect(options.model).toBe("grok-4");
        expect(options.configuration?.baseURL).toBe("https://proxy.example/v1");
    });

    it("maps the temperature and output token limit onto the client options", async () => {
        await GrokChatProvider.factory.connect({
            apiKey: "xai-key",
            generationParameters: {
                temperature: 0.3,
                maxOutputTokens: 512,
            },
        });
        const options = lastClientOptions();
        expect(options.temperature).toBe(0.3);
        expect(options.maxCompletionTokens).toBe(512);
    });

    it("leaves generation parameters unset when none are configured", async () => {
        await GrokChatProvider.factory.connect({ apiKey: "xai-key" });
        const options = lastClientOptions();
        expect(options.temperature).toBeUndefined();
        expect(options.maxTokens).toBeUndefined();
        expect(options.maxCompletionTokens).toBeUndefined();
    });

    it("is ready only when an API key is set", async () => {
        const withKey = await GrokChatProvider.factory.connect({ apiKey: "xai-key" });
        const emptyKey = await GrokChatProvider.factory.connect({ apiKey: "" });
        const noKey = await GrokChatProvider.factory.connect({});
        expect(withKey.isReady()).toBe(true);
        expect(emptyKey.isReady()).toBe(false);
        expect(noKey.isReady()).toBe(false);
    });

    it("generates text through the LangChain client", async () => {
        invokeMock.mockResolvedValue({ content: "Hello from Grok" });
        const provider = await GrokChatProvider.factory.connect({ apiKey: "xai-key" });
        const messages = [new HumanMessage("hi")];

        await expect(provider.generate(messages)).resolves.toBe("Hello from Grok");
        expect(invokeMock).toHaveBeenCalledWith(messages);
    });
});
