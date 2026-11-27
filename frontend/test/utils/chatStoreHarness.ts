/**
 * @fileoverview Shared harness for the behavior tests of `ChatStore`.
 *
 * Real stores (settings, characters, personas), the real `MockChatProvider` and the real provider
 * classes are used. Only the true boundaries are replaced: storage by an in-memory adapter that
 * honors the adapter contract, the hook worker by a spy on `hookService.process` (in the tests that
 * need it), and the LLM network by a scripted `ChatProvider`.
 *
 * A test file using this harness must:
 * - start with `// @vitest-environment jsdom`,
 * - mock `@/lib/parsers/magicPatternParser` (the real one spins up a QuickJS web worker), and
 * - call `installChatStoreHooks()` once at the top level.
 */
import { vi, beforeAll, beforeEach, afterEach } from "vitest";
import type { BaseMessage } from "@langchain/core/messages";
import { apply } from "@arisutalk/character-spec/utils";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { ChatStore } from "@/features/chat/stores/chatStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { ChatProvider } from "@/lib/interfaces";
import { MockChatProvider } from "@/lib/providers/chat/MockChatProvider";
import { LLMConfigSchema, SettingsSchema, type LLMConfig } from "@/lib/types/IDataModel";
import { Logger } from "@common/logger/Logger";
import { InMemoryChatAdapter } from "@test/utils/mock/InMemoryChatAdapter";

/** Provider test double standing in for the network: records what it received and runs a script. */
export class ScriptedProvider extends ChatProvider<"MOCK"> {
    id = "scripted";
    name = "Scripted";
    description = "Scripted test provider";
    /** Message lists passed to `stream`, one entry per call. */
    readonly received: BaseMessage[][] = [];
    /** How many times `abort` was called. */
    abortCalls = 0;

    constructor(private readonly script: () => AsyncGenerator<string, void, unknown>) {
        super();
    }
    async disconnect(): Promise<void> {}
    async generate(): Promise<string> {
        return "";
    }
    async *stream(messages: BaseMessage[]): AsyncGenerator<string, void, unknown> {
        this.received.push(messages);
        yield* this.script();
    }
    abort(): void {
        this.abortCalls++;
    }
    isReady(): boolean {
        return true;
    }
}

/**
 * Provider that streams the given chunks.
 * @param chunks - Chunks to yield, in order.
 */
export function replying(...chunks: string[]): ScriptedProvider {
    return new ScriptedProvider(async function* () {
        yield* chunks;
    });
}

/**
 * Builds a provider config for the given provider.
 * @param id - Config id.
 * @param provider - Provider kind.
 * @param enabled - Whether the config is enabled.
 */
export function makeConfig(id: string, provider: LLMConfig["provider"], enabled = true): LLMConfig {
    return apply(LLMConfigSchema, {
        id,
        provider,
        name: id,
        apiKey: "test-key",
        model: "test-model",
        enabled,
    });
}

/**
 * `[role, text]` pairs of messages, for compact assertions.
 * @param messages - Messages to summarize.
 */
export function transcript(messages: Message[]): [string, unknown][] {
    return messages.map((m) => [m.role, m.content.data]);
}

/**
 * Text content of a LangChain message.
 * @param message - The message to read.
 */
export function textOf(message: BaseMessage): string {
    return typeof message.content === "string" ? message.content : JSON.stringify(message.content);
}

/**
 * Creates an initialized store on a fresh in-memory adapter, using a deterministic Mock provider.
 * @param adapter - Adapter to back the store with.
 */
export async function createStore(adapter = new InMemoryChatAdapter()) {
    const store = new ChatStore(adapter);
    await store.initPromise;
    await store.setProvider("MOCK", { mockDelay: 0, responses: ["Reply"] });
    return { store, adapter };
}

/**
 * Installs a scripted provider into the store through the public `setProvider` API.
 * @param store - Store to configure.
 * @param provider - Provider the store connects to next.
 */
export async function useProvider(store: ChatStore, provider: ScriptedProvider): Promise<void> {
    vi.spyOn(MockChatProvider.factory, "connect").mockResolvedValueOnce(provider);
    await store.setProvider("MOCK", {});
}

/**
 * Creates a direct chat for `characterId`, makes it active and returns its id.
 * @param store - Store to create the chat in.
 * @param characterId - Character of the chat.
 * @param title - Title of the chat.
 */
export async function openChat(
    store: ChatStore,
    characterId = "char-1",
    title = "Chat"
): Promise<string> {
    const id = await store.createChat(characterId, title);
    await store.setActiveChat(id);
    return id;
}

/** Registers the setup and cleanup hooks every `ChatStore` behavior test file needs. */
export function installChatStoreHooks(): void {
    beforeAll(async () => {
        settings.isLoaded = true;
        await characterStore.initPromise;
        await personaStore.initPromise;
    });

    beforeEach(() => {
        settings.isLoaded = true;
        settings.value = apply(SettingsSchema, {});
        characterStore.characters.length = 0;
        personaStore.personas.length = 0;
        personaStore.activePersonaId = null;
        vi.spyOn(Logger, "structured").mockImplementation(() => {});
        // Stores of earlier tests keep their settings effect alive and log on every settings reset.
        vi.spyOn(Logger, "info").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });
}
