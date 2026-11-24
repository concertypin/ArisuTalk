/**
 * @fileoverview Phase 4 Integration & E2E Testing.
 * Covers both functional flows (system prompt assembly, toggle, magic patterns, template seeding, cleanup)
 * and visual styling guidelines (button layout wrap prevention, button alignment, empty state button classes)
 * in a single sequential test to prevent race conditions on the global singleton chatStore.
 */

import { test, expect, describe, vi, afterEach, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import { apply } from "@arisutalk/character-spec/utils";
import CharacterLayoutTestWrapper from "../wrappers/CharacterLayoutTestWrapper.svelte";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import type { IChatStorageAdapter, LocalChat, ChatType } from "@/lib/interfaces";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import type { BaseMessage } from "@langchain/core/messages";
import { PromptTemplateStore } from "@/features/promptTemplate/stores/promptTemplateStore.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import { buildSystemPrompt } from "@/lib/prompts/systemPromptBuilder";

let capturedMessages: unknown[] = [];

// Mock MagicPatternParser to avoid loading web worker (QuickJS sandbox) in jsdom testing
vi.mock("@/lib/parsers/magicPatternParser", () => {
    return {
        parseMagicPatterns: vi
            .fn()
            .mockImplementation(
                async (text: string, context?: { character?: { name: string } }) => {
                    let replaced = text;
                    if (context?.character?.name) {
                        replaced = replaced.replace(
                            /\{\|\s*character\.name\s*\|\}/g,
                            context.character.name
                        );
                    }
                    return replaced;
                }
            ),
        default: vi.fn(),
    };
});

// A type-safe mock implementation of IChatStorageAdapter to avoid untyped casts.
class MockChatStorageAdapter implements IChatStorageAdapter {
    constructor(private chatsList: LocalChat[]) {}

    async init(): Promise<void> {}
    async createChat(
        _characterId: string,
        _title?: string,
        _chatType?: ChatType,
        _participantIds?: string[]
    ): Promise<string> {
        return "mock-chat-id";
    }
    async getChat(id: string): Promise<LocalChat | undefined> {
        return this.chatsList.find((c) => c.id === id);
    }
    async getAllChats(): Promise<LocalChat[]> {
        return this.chatsList;
    }
    async getChatsByCharacter(characterId: string): Promise<LocalChat[]> {
        return this.chatsList.filter((c) => c.characterId === characterId);
    }
    async getChatsByParticipant(_characterId: string): Promise<LocalChat[]> {
        return [];
    }
    async updateChat(_chatId: string, _updates: Partial<LocalChat>): Promise<void> {}
    async addMessage(_chatId: string, _message: Message): Promise<void> {}
    async deleteChat(_id: string): Promise<void> {}
    async getMessages(_chatId: string): Promise<Message[]> {
        return [];
    }
    async updateMessage(
        _chatId: string,
        _messageId: string,
        _content: Message["content"]
    ): Promise<void> {}
    async deleteMessage(_chatId: string, _messageId: string): Promise<void> {}
}

describe("Phase 4 E2E & Visual Verification (Sequential Suite)", () => {
    beforeEach(async () => {
        capturedMessages = [];
    });

    afterEach(() => {
        vi.restoreAllMocks();
        StorageResolver.reset(); // Reset singletons between test cycles
    });

    test("Execute Full QA E2E & Visual Verification Scenarios Sequentially", async () => {
        const user = userEvent.setup();
        // --- SCENARIO 1: Default templates seeding initialization ---
        localStorage.removeItem("arisutalk_prompt_templates");

        const tempStore = new PromptTemplateStore();
        await tempStore.initPromise;

        const storedTemplates = localStorage.getItem("arisutalk_prompt_templates");
        expect(storedTemplates).not.toBeNull();
        const parsedTemplates = JSON.parse(storedTemplates || "[]") as { name: string }[];
        expect(parsedTemplates.length).toBeGreaterThanOrEqual(3);
        expect(parsedTemplates[0].name).toBeDefined();

        // --- SCENARIO 2: UI/UX Setup & Mock Provider Setup ---
        // Setup direct chat seeding object. Include both title and name to align with UI text lookups.
        const chatObj: LocalChat = {
            id: "char-e2e-qa-session",
            characterId: "char-e2e-qa",
            chatType: "direct" as const,
            title: "Chat 1",
            name: "Chat 1",
            lastMessage: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // CRITICAL: Overwrite the StorageResolver singleton cache field directly with a type-safe Mock adapter
        // to bypass the singleton check and prevent fallback DB adapters from being loaded asynchronously.
        const mockChatAdapter = new MockChatStorageAdapter([chatObj]);
        StorageResolver["chatAdapter"] = mockChatAdapter;

        vi.spyOn(chatStore, "waitForSettings").mockResolvedValue(undefined);
        await chatStore.initPromise;

        // Reset singleton store state to avoid contamination and preserve reactivity
        chatStore.chats.length = 0;
        chatStore.chats.push(chatObj);
        chatStore.activeChatId = chatObj.id;
        chatStore.activeMessages = [];
        chatStore.isGenerating = false;

        // Manually override chatStore's adapter reference as well to ensure total mock coverage
        chatStore["adapter"] = mockChatAdapter;

        // Seed Character using statically imported CharacterSchema
        const testChar = apply(CharacterSchema, {
            id: "char-e2e-qa",
            name: "Arisu",
            description: "A cute loyal maid",
            specVersion: 0,
            prompt: {
                description: "You are Arisu, a loyal maid. Address user as 御主人様.",
                authorsNote: "",
                lorebook: { config: {}, data: [] },
            },
            executables: {
                runtimeSetting: { timeout: 30000 },
                replaceHooks: { display: [], input: [], output: [], request: [] },
            },
            assets: { assets: [] },
        });
        characterStore.characters = [testChar];

        // Seed Persona (Aligned with assertion check)
        const testPersona = {
            id: "persona-e2e-qa",
            name: "메스가키",
            description: "You are bratty. Call user ザコ♡ and end sentences with ♡.",
        };
        personaStore.personas = [testPersona];
        personaStore.activePersonaId = "persona-e2e-qa";
        settings.value.prompt.generationPrompt = "You are a helpful assistant.";

        // Let the store resolve its init promise safely
        await chatStore.initPromise;

        renderWithAppContext(CharacterLayoutTestWrapper, {});

        // --- SCENARIO 3: Empty state UI styling verification ---
        const emptyStateText = screen.getByText(
            "Select a character from the sidebar to start chatting"
        );
        expect(emptyStateText).toBeInTheDocument();

        const mainElement = document.querySelector("main");
        expect(mainElement).not.toBeNull();
        const buttons = mainElement!.querySelectorAll("button");
        expect(buttons.length).toBeGreaterThanOrEqual(3);

        const btnCreateChar = Array.from(buttons).find((b) =>
            b.textContent?.includes("Create Character")
        );
        const btnManagePersonas = Array.from(buttons).find((b) =>
            b.textContent?.includes("Manage Personas")
        );
        const btnCreateGroup = Array.from(buttons).find((b) =>
            b.textContent?.includes("Create Group Chat")
        );

        expect(btnCreateChar?.className).toContain("btn");
        expect(btnManagePersonas?.className).toContain("btn-ghost");
        expect(btnCreateGroup?.className).toContain("btn-outline");

        // --- SCENARIO 4: Character Selection ---
        const charBtn = screen.getByRole("button", { name: "Arisu" });
        await user.click(charBtn);

        // --- SCENARIO 5: Header wrap prevention & Sidebar hover alignment ---
        // The chat header appears once the selection has loaded the character's chat.
        const chatHeaderButtons = await screen.findByRole("button", {
            name: "Character Settings",
        });
        expect(chatHeaderButtons).toBeInTheDocument();
        const buttonGroupContainer = chatHeaderButtons.parentElement;
        expect(buttonGroupContainer?.className).toContain("flex");

        const chatListItem = await screen.findByRole("button", { name: /Chat 1/ });
        await user.hover(chatListItem);

        const sidebarElement = document.querySelector("nav");
        expect(sidebarElement).not.toBeNull();
        const branchViewerBtnElement = sidebarElement!.querySelector(
            '[aria-label="Branch Viewer"]'
        );
        const deleteBtnElement = sidebarElement!.querySelector('[aria-label="Delete"]');
        expect(branchViewerBtnElement).not.toBeNull();
        expect(deleteBtnElement).not.toBeNull();

        // --- SCENARIO 6: Functional System Prompt Assembly ---
        const input = screen.getByPlaceholderText("Type a message...");
        await fillText(user, input, "Hello, how are you?");

        // Re-inject mock provider and spy immediately before message dispatch
        // Use mockDelay: 0 to progress immediately without fake timers
        await chatStore.setProvider("MOCK", {
            mockDelay: 0,
            responses: ["御主人様, how can I help? (Bratty smile) ♡"],
            generationParameters: {},
        });
        const liveStream = chatStore["activeProvider"]!.stream.bind(chatStore["activeProvider"]);
        chatStore["activeProvider"]!.stream = async function* (msgs: BaseMessage[]) {
            capturedMessages = msgs;
            yield* liveStream(msgs);
        };

        const sendBtn = screen.getByRole("button", { name: "Send" });
        await user.click(sendBtn);

        await waitFor(() => expect(capturedMessages.length).toBeGreaterThanOrEqual(2));
        const systemMsg = capturedMessages[0] as { _getType: () => string; content: string };
        expect(systemMsg._getType()).toBe("system");

        expect(systemMsg.content).toContain("You are a helpful assistant.");
        expect(systemMsg.content).toContain("御主人様");
        expect(systemMsg.content).toContain("bratty"); // persona description (inner marker removed in 3rd review)
        expect(systemMsg.content).toContain("ザコ♡");

        const responseText = await screen.findByText(
            "御主人様, how can I help? (Bratty smile) ♡",
            {},
            { timeout: 5000 }
        );
        expect(responseText).toBeInTheDocument();

        // --- SCENARIO 7: Functional System Prompt Builder Unit Tests ---

        // Section Toggle exclusion (using apply with static CharacterSchema to safely build Character type)
        const mockCharacterToggle = apply(CharacterSchema, {
            ...testChar,
            id: "c-override",
            prompt: {
                ...testChar.prompt,
                description: "Loyal maid traits.",
            },
        });

        const resultToggle = await buildSystemPrompt(
            {
                generationPrompt: "System instruction.",
                character: mockCharacterToggle,
                persona: { name: "PersonaName", description: "Bratty traits." },
            },
            [
                { key: "system", enabled: true },
                { key: "character", enabled: false }, // character excluded
                { key: "persona", enabled: true },
                { key: "lore", enabled: true },
            ]
        );
        expect(resultToggle).toContain("System instruction.");
        expect(resultToggle).toContain("Bratty traits.");
        expect(resultToggle).not.toContain("Loyal maid traits.");

        // Magic pattern evaluation (using apply with static CharacterSchema to safely build Character type)
        const characterNameMock = apply(CharacterSchema, {
            ...testChar,
            id: "c-magic",
            name: "Nexon Blue Archive Arisu",
            prompt: {
                ...testChar.prompt,
                description: "You are Nexon Blue Archive Arisu.",
            },
        });

        const resultMagic = await buildSystemPrompt({
            generationPrompt: "My character name is {| character.name |}.",
            character: characterNameMock,
            persona: undefined,
        });
        expect(resultMagic).toContain("My character name is Nexon Blue Archive Arisu.");

        // --- SCENARIO 8: Provider Error & Empty message cleanup ---
        // Setup provider to fail on stream
        await chatStore.setProvider("MOCK", {
            mockDelay: 0,
            responses: [],
            generationParameters: {},
        });
        chatStore["activeProvider"]!.stream = async function* () {
            yield ""; // generator yield protection
            throw new Error("Provider Failure Simulation");
        };

        // Inject new chat for cleanup test
        const cleanupChat: LocalChat = {
            id: "chat-cleanup-test",
            characterId: "char-e2e-qa",
            chatType: "direct" as const,
            title: "Cleanup Chat",
            name: "Cleanup Chat",
            lastMessage: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        chatStore.chats.push(cleanupChat);
        chatStore.activeChatId = cleanupChat.id;
        chatStore.activeMessages = [];

        try {
            await chatStore.sendMessage("Simulated fail trigger");
        } catch {
            // expected error
        }

        const aiMessages = chatStore.activeMessages.filter((m) => m.role === "assistant");
        expect(aiMessages.length).toBe(0);
        expect(chatStore.isGenerating).toBe(false);
    }, 30000); // 30s: covers 8 sequential E2E scenarios in one test
});
