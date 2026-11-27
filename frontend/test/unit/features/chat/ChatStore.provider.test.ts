// @vitest-environment jsdom
/**
 * @fileoverview Provider selection and initialization of `ChatStore`: which LLM config becomes the provider, and how loading chats and waiting for settings behave.
 */
import { describe, it, expect, vi } from "vitest";
import { HumanMessage } from "@langchain/core/messages";
import { ChatStore } from "@/features/chat/stores/chatStore.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";
import { GeminiChatProvider } from "@/lib/providers/chat/GeminiChatProvider";
import { OpenAIChatProvider } from "@/lib/providers/chat/OpenAIChatProvider";
import { AnthropicChatProvider } from "@/lib/providers/chat/AnthropicChatProvider";
import { OpenRouterChatProvider } from "@/lib/providers/chat/OpenRouterChatProvider";
import { GrokChatProvider } from "@/lib/providers/chat/GrokChatProvider";
import { Logger } from "@common/logger/Logger";
import { InMemoryChatAdapter } from "@test/utils/mock/InMemoryChatAdapter";
import { createStore, installChatStoreHooks, makeConfig } from "@test/utils/chatStoreHarness";

// The magic pattern parser spins up a QuickJS web worker, which is not available in unit tests.
vi.mock("@/lib/parsers/magicPatternParser", () => ({
    parseMagicPatterns: vi.fn(async (text: string) => text),
}));

installChatStoreHooks();

describe("provider selection", () => {
    it("falls back to the Mock provider with a configure hint when no LLM config exists", async () => {
        const store = new ChatStore(new InMemoryChatAdapter());
        await store.initPromise;

        const provider = store["activeProvider"];
        expect(provider).toBeInstanceOf(MockChatProvider);
        expect(store.activeConfigId).toBeNull();
        await expect(provider?.generate([new HumanMessage("hi")])).resolves.toBe(
            "Please configure an LLM in Settings → LLM Configuration."
        );
    });

    it("uses the config selected by activeLLMConfigId", async () => {
        settings.value.llmConfigs = [
            makeConfig("anthropic-1", "Anthropic"),
            makeConfig("gemini-1", "Gemini"),
        ];
        settings.value.activeLLMConfigId = "gemini-1";

        const store = new ChatStore(new InMemoryChatAdapter());
        await store.initPromise;

        expect(store["activeProvider"]).toBeInstanceOf(GeminiChatProvider);
        expect(store.activeConfigId).toBe("gemini-1");
    });

    it("skips a disabled active config and uses the first enabled one", async () => {
        settings.value.llmConfigs = [
            makeConfig("off", "Gemini", false),
            makeConfig("on", "Anthropic"),
        ];
        settings.value.activeLLMConfigId = "off";

        const store = new ChatStore(new InMemoryChatAdapter());
        await store.initPromise;

        expect(store["activeProvider"]).toBeInstanceOf(AnthropicChatProvider);
        expect(store.activeConfigId).toBe("on");
    });

    it("uses the first enabled config when the active id matches no config", async () => {
        settings.value.llmConfigs = [makeConfig("a", "Grok"), makeConfig("b", "Anthropic")];
        settings.value.activeLLMConfigId = "deleted-config";

        const store = new ChatStore(new InMemoryChatAdapter());
        await store.initPromise;

        expect(store["activeProvider"]).toBeInstanceOf(GrokChatProvider);
        expect(store.activeConfigId).toBe("a");
    });

    it("falls back to the Mock provider when every config is disabled", async () => {
        settings.value.llmConfigs = [makeConfig("off", "Gemini", false)];

        const store = new ChatStore(new InMemoryChatAdapter());
        await store.initPromise;

        expect(store["activeProvider"]).toBeInstanceOf(MockChatProvider);
        expect(store.activeConfigId).toBeNull();
    });

    it.each([
        ["Gemini", GeminiChatProvider],
        ["Anthropic", AnthropicChatProvider],
        ["OpenAI", OpenAIChatProvider],
        ["OpenAI-compatible", OpenAIChatProvider],
        ["OpenRouter", OpenRouterChatProvider],
        ["Grok", GrokChatProvider],
        ["Mock", MockChatProvider],
    ] as const)(
        "applyConfig maps a %s config to its provider class",
        async (name, providerClass) => {
            const { store } = await createStore();
            const config = makeConfig(`cfg-${name}`, name);

            await store.applyConfig(config);

            expect(store["activeProvider"]).toBeInstanceOf(providerClass);
            expect(store.activeConfigId).toBe(config.id);
        }
    );

    it("disconnects the previous provider when switching providers", async () => {
        const { store } = await createStore();
        const previous = store["activeProvider"];
        expect(previous).not.toBeNull();
        const disconnect = vi.spyOn(previous!, "disconnect");

        await store.setProvider("MOCK", { responses: ["next"] });

        expect(disconnect).toHaveBeenCalledOnce();
        expect(store["activeProvider"]).not.toBe(previous);
    });

    it("refreshProvider reloads the provider from the current configs on demand", async () => {
        const { store } = await createStore();
        expect(store.activeConfigId).toBeNull();
        // While settings are not loaded the automatic reload is paused, so only the explicit call can switch.
        settings.isLoaded = false;
        settings.value.llmConfigs = [makeConfig("late", "Anthropic")];
        await Promise.resolve();
        expect(store.activeConfigId).toBeNull();

        await store.refreshProvider();

        expect(store["activeProvider"]).toBeInstanceOf(AnthropicChatProvider);
        expect(store.activeConfigId).toBe("late");
    });

    it("reloads the provider on its own when the active config setting changes", async () => {
        settings.value.llmConfigs = [makeConfig("one", "Anthropic"), makeConfig("two", "Grok")];
        settings.value.activeLLMConfigId = "one";
        const store = new ChatStore(new InMemoryChatAdapter());
        await store.initPromise;
        expect(store.activeConfigId).toBe("one");

        settings.value.activeLLMConfigId = "two";

        await vi.waitFor(() => expect(store.activeConfigId).toBe("two"));
        expect(store["activeProvider"]).toBeInstanceOf(GrokChatProvider);
    });
});

describe("initialization and settings wait", () => {
    it("loads existing chats from the adapter", async () => {
        const adapter = new InMemoryChatAdapter();
        const idA = await adapter.createChat("char-1", "Alpha");
        const idB = await adapter.createChat("char-2", "Beta");

        const { store } = await createStore(adapter);

        expect(store.chats.map((c) => c.id)).toEqual([idA, idB]);
    });

    it("starts with no chats and logs the failure when the adapter cannot load", async () => {
        const adapter = new InMemoryChatAdapter();
        await adapter.createChat("char-1", "Unreachable");
        vi.spyOn(adapter, "getAllChats").mockRejectedValue(new Error("disk unavailable"));
        const logError = vi.spyOn(Logger, "error").mockImplementation(() => {});

        const { store } = await createStore(adapter);

        expect(store.chats).toEqual([]);
        expect(logError).toHaveBeenCalledWith("Failed to load chats", expect.any(Error));
    });

    it("waitForSettings resolves without warning once settings finish loading", async () => {
        const { store } = await createStore();
        vi.useFakeTimers();
        settings.isLoaded = false;
        const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});

        const waiting = store.waitForSettings();
        await vi.advanceTimersByTimeAsync(250);
        settings.isLoaded = true;
        await vi.advanceTimersByTimeAsync(100);

        await expect(waiting).resolves.toBeUndefined();
        expect(warn).not.toHaveBeenCalled();
    });

    it("waitForSettings gives up with a warning after five seconds", async () => {
        const { store } = await createStore();
        vi.useFakeTimers();
        settings.isLoaded = false;
        const warn = vi.spyOn(Logger, "warn").mockImplementation(() => {});

        const waiting = store.waitForSettings();
        await vi.advanceTimersByTimeAsync(4900);
        expect(warn).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(200);

        await waiting;
        expect(warn).toHaveBeenCalledWith(
            "ChatStore: Settings did not load in time, using defaults"
        );
    });
});
