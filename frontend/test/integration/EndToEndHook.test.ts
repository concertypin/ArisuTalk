import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatStore } from "@/features/chat/stores/chatStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import {
    CharacterSchema,
    type Character,
    ChatSchema,
} from "@arisutalk/character-spec/v0/Character";
import { PersonaSchema, type Persona } from "@/features/persona/schema";
import { apply } from "@arisutalk/character-spec/utils";
import type { IChatStorageAdapter, ChatProvider, LocalChat, ProviderType } from "@/lib/interfaces";

// Mock everything needed
vi.mock("@/features/character/stores/characterStore.svelte", () => ({
    characterStore: {
        characters: [],
    },
}));

vi.mock("@/features/persona/stores/personaStore.svelte", () => ({
    personaStore: {
        activePersona: null,
    },
}));

vi.mock("@/lib/workers/workerClient", () => ({
    getRegexWorker: vi.fn(async () => ({
        replace: vi.fn(async (text: string, pattern: string, replacement: string) =>
            text.replace(new RegExp(pattern, "g"), replacement)
        ),
    })),
    getScriptingWorker: vi.fn(async () => ({
        execute: vi.fn(async (code: string) => ({
            result: eval(code) as unknown,
            logs: [],
        })),
    })),
}));

// Mock settings
vi.mock("@/lib/stores/settings.svelte", () => ({
    settings: {
        isLoaded: true,
        value: {
            activeLLMConfigId: "default",
            llmConfigs: [{ id: "default", provider: "Mock", enabled: true }],
        },
    },
}));

interface PrivateChatStore {
    adapter: IChatStorageAdapter;
    chats: LocalChat[];
    activeProvider: ChatProvider<ProviderType>;
}

describe("End-to-End Hook Integration", () => {
    let chatStore: ChatStore;

    beforeEach(() => {
        vi.clearAllMocks();
        chatStore = new ChatStore();
    });

    it("should transform message content through hooks", async () => {
        const mockCharacter = apply(CharacterSchema, {
            id: "char-1",
            name: "Test Character",
            description: "Test description",
            specVersion: 0,
            prompt: {
                description: "Prompt description",
                lorebook: {
                    config: {},
                    data: [],
                },
            },
            executables: {
                runtimeSetting: { timeout: 3 },
                replaceHooks: {
                    input: [
                        {
                            input: "hello",
                            output: "HI",
                            meta: {
                                type: "string",
                                caseSensitive: false,
                                priority: 0,
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                            },
                        },
                    ],
                    output: [
                        {
                            input: "AI",
                            output: "ROBOT",
                            meta: {
                                type: "string",
                                caseSensitive: false,
                                priority: 0,
                                isInputPatternScripted: false,
                                isOutputScripted: false,
                            },
                        },
                    ],
                    display: [],
                    request: [],
                },
            },
            metadata: {
                license: "MIT",
            },
            assets: {
                assets: [],
            },
        });

        const mockPersona = apply(PersonaSchema, {
            id: "p1",
            name: "User",
            description: "User description",
            allowLowLevelAccess: false,
        });

        const mockChat = {
            ...apply(ChatSchema, {
                id: "chat-1",
                characterId: "char-1",
                title: "Test Chat",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }),
            name: "Test Chat",
            lastMessage: Date.now(),
            characterId: "char-1",
        } as LocalChat;

        (characterStore as { characters: Character[] }).characters = [mockCharacter];
        (personaStore as { activePersona: Persona | null }).activePersona = mockPersona;

        // Mock chat adapter
        const mockAdapter: IChatStorageAdapter = {
            init: vi.fn(),
            getAllChats: vi.fn(async () => [mockChat]),
            getMessages: vi.fn(async () => []),
            addMessage: vi.fn(),
            createChat: vi.fn(),
            getChat: vi.fn(),
            getChatsByCharacter: vi.fn(),
            deleteChat: vi.fn(),
            updateMessage: vi.fn(),
            deleteMessage: vi.fn(),
        };

        // Inject dependencies manually to bypass async wait
        const privateStore = chatStore as unknown as PrivateChatStore;
        privateStore.adapter = mockAdapter;
        privateStore.chats = [mockChat];
        chatStore.activeChatId = "chat-1";

        // Mock provider explicitly
        privateStore.activeProvider = {
            stream: async function* () {
                yield "AI response";
            },
            disconnect: vi.fn(),
            abort: vi.fn(),
        } as unknown as ChatProvider<ProviderType>;

        // Send message
        await chatStore.sendMessage("hello world");

        // Verify user message transformation (input hook)
        expect(mockAdapter.addMessage).toHaveBeenCalledWith(
            "chat-1",
            expect.objectContaining({
                role: "user",
                content: { type: "text", data: "HI world" },
            })
        );

        // Verify AI message transformation (output hook)
        expect(mockAdapter.addMessage).toHaveBeenCalledWith(
            "chat-1",
            expect.objectContaining({
                role: "assistant",
                content: { type: "text", data: "ROBOT response" },
            })
        );
    });
});
