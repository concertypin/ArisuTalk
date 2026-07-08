import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatStore } from "@/features/chat/stores/chatStore.svelte";
import {
    CharacterSchema,
    type Character,
    ChatSchema,
} from "@arisutalk/character-spec/v0/Character";
import { PersonaSchema, type Persona } from "@/features/persona/schema";
import { apply } from "@arisutalk/character-spec/utils";
import type { IChatStorageAdapter, LocalChat } from "@/lib/interfaces";

// Use vi.hoisted to ensure these are available when vi.mock factories run
const { mockCharacterStoreState, mockPersonaStoreState } = vi.hoisted(() => ({
    mockCharacterStoreState: { characters: [] as Character[] },
    mockPersonaStoreState: { activePersona: null as Persona | null },
}));

vi.mock("@/features/character/stores/characterStore.svelte", () => ({
    characterStore: mockCharacterStoreState,
}));

vi.mock("@/features/persona/stores/personaStore.svelte", () => ({
    personaStore: mockPersonaStoreState,
}));

vi.mock("@/lib/workers/workerClient", () => ({
    getRegexWorker: vi.fn(async () => ({
        replace: vi.fn(async (text: string, pattern: string, replacement: string) =>
            text.replace(new RegExp(pattern, "g"), replacement)
        ),
    })),
    getScriptingWorker: vi.fn(async () => ({
        execute: vi.fn(async (code: string) => ({
            // Scripting worker is used for testing purposes
            // No actual worker making, since Node has no compatible Web Worker API
            // oxlint-disable-next-line no-eval
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
            prompt: { generationPrompt: "Test system prompt" },
        },
    },
}));

describe("End-to-End Hook Integration", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        // Reset mock state
        mockCharacterStoreState.characters = [];
        mockPersonaStoreState.activePersona = null;
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

        const mockChat: LocalChat = {
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
        };

        // Set mock data via mutable mock state (no type casts needed)
        mockCharacterStoreState.characters = [mockCharacter];
        mockPersonaStoreState.activePersona = mockPersona;

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
            getChatsByParticipant: vi.fn(),
            updateChat: vi.fn(),
        };

        // Use ChatStore's constructor with injected adapter
        // Create a new store with the mock adapter
        const testStore = new ChatStore(mockAdapter);
        await testStore.initPromise;

        // Set chats via setProvider pattern (avoid private access)
        await testStore.setProvider("MOCK", {
            mockDelay: 0,
            responses: ["AI response"],
        });

        // Access the public API to set up state
        // We need to use the internal state since chats comes from adapter
        Object.assign(testStore, { chats: [mockChat] });
        testStore.activeChatId = "chat-1";

        // Send message
        await testStore.sendMessage("hello world");

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
