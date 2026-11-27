/**
 * @fileoverview E2E-style integration test for system prompt injection.
 *
 * Verifies the full flow: character prompt + persona + generation prompt
 * are assembled into a SystemMessage and sent to the LLM provider.
 *
 * Regression defense for the system prompt builder integration.
 */

import { test, expect, describe, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import { apply } from "@arisutalk/character-spec/utils";
import type { BaseMessage } from "@langchain/core/messages";
import CharacterLayoutTestWrapper from "@test/browser/wrappers/CharacterLayoutTestWrapper.svelte";
import { SystemMessage } from "@langchain/core/messages";
import { CharacterSchema } from "@arisutalk/character-spec/v0/Character";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { personaStore } from "@/features/persona/stores/personaStore.svelte";
import { settings } from "@/lib/stores/settings.svelte";
import PromptSettings from "@/components/settingSubpage/PromptSettings.svelte";
import { buildSystemPrompt } from "@/lib/prompts/systemPromptBuilder";

// Capture what the chat store passes to the provider
let capturedMessages: BaseMessage[] = [];
describe("System Prompt E2E", () => {
    beforeEach(async () => {
        capturedMessages = [];
        await chatStore.initPromise;

        // Set up a mock provider that captures the messages it receives
        await chatStore.setProvider("MOCK", {
            // No per-character stream delay, so replies render within the findBy timeout.
            mockDelay: 0,
            responses: ["I am Arisu the maid. 주인님, how can I help?"],
            generationParameters: {},
        });

        // Spy on the stream method to capture messages passed to the provider
        const originalStream = chatStore["activeProvider"]!.stream.bind(
            chatStore["activeProvider"]
        );
        chatStore["activeProvider"]!.stream = async function* (msgs: BaseMessage[]) {
            capturedMessages = [...msgs];
            yield* originalStream(msgs);
        };
    });
    afterEach(() => {
        vi.restoreAllMocks();
        // Reset chatStore singleton state to prevent leaking to next test
        if (chatStore && chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        if (chatStore) {
            chatStore["activeProvider"] = null;
            chatStore.isGenerating = false;
        }
    });
    test("system prompt includes character, persona, and generation prompt", async () => {
        const user = userEvent.setup();
        // Set up a character with a system prompt
        const testChar = apply(CharacterSchema, {
            id: "char-e2e",
            name: "Arisu",
            description: "A maid",
            specVersion: 0,
            prompt: {
                description: "You are Arisu, a loyal maid. Call the user 주인님.",
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

        // Set up a persona
        const testPersona = {
            id: "persona-e2e",
            name: "꼬마 악당",
            description: "Bratty girl. Call user 허접♡.",
        };
        personaStore.personas = [testPersona];
        personaStore.activePersonaId = "persona-e2e";

        // Set generation prompt
        settings.value.prompt.generationPrompt = "You are a helpful assistant.";

        // Create a chat for the character
        renderWithAppContext(CharacterLayoutTestWrapper, {});

        // Select the character
        const charBtn = screen.getByRole("button", { name: "Arisu" });
        expect(charBtn).toBeInTheDocument();
        await user.click(charBtn);
        // Create a new chat
        const newChatBtn = screen.getByLabelText("New Direct Chat");
        expect(newChatBtn).toBeInTheDocument();
        await user.click(newChatBtn);

        // Send a message
        const input = screen.getByPlaceholderText("Type a message...");
        expect(input).toBeInTheDocument();
        await fillText(user, input, "Hello");

        const sendBtn = screen.getByRole("button", { name: "Send" });
        await user.click(sendBtn);

        // Verify the user message appears
        const userMsg = await screen.findByText("Hello");
        expect(userMsg).toBeInTheDocument();

        // Verify the AI response appears (real timers; findBy polls until it renders)
        const aiResponse = await screen.findByText(/주인님/, {}, { timeout: 5000 });
        expect(aiResponse).toBeInTheDocument();

        // Verify the system prompt was assembled correctly
        // The first message should be a SystemMessage containing all sections
        expect(capturedMessages.length).toBeGreaterThanOrEqual(2);

        const systemMsg = capturedMessages[0];
        // Use instanceof check (avoids deprecated _getType)
        expect(systemMsg).toBeInstanceOf(SystemMessage);

        // System prompt should contain all sections
        expect(systemMsg.content).toContain("You are a helpful assistant."); // generation prompt
        expect(systemMsg.content).toContain("주인님"); // character prompt
        expect(systemMsg.content).toContain("Bratty girl"); // persona description
    });

    test("toggling a section in PromptSettings updates settings.value.prompt.promptSections", async () => {
        const user = userEvent.setup();
        // Render PromptSettings directly and toggle the "Character" section off.
        // Verifies the UI → settings store flow (replaces the prior tautological
        // direct buildSystemPrompt call).
        // Reset settings to a known state
        settings.value.prompt.promptSections = [];

        render(PromptSettings);

        // Find the Character section toggle (aria-label="Character")
        const characterToggle = screen.getByRole("checkbox", { name: "Character" });
        expect(characterToggle).toBeInTheDocument();

        // Initially enabled (default)
        const initialEl = characterToggle;
        if (!(initialEl instanceof HTMLInputElement)) {
            throw new Error("Expected HTMLInputElement for checkbox toggle");
        }
        expect(initialEl.checked).toBe(true);

        // Click to disable
        await user.click(characterToggle);

        // After clicking, the settings store should reflect the toggle
        const characterOverride = settings.value.prompt.promptSections?.find(
            (s) => s.key === "character"
        );
        expect(characterOverride).toBeDefined();
        expect(characterOverride?.enabled).toBe(false);

        // The System section should still default to enabled (not in overrides)
        const systemOverride = settings.value.prompt.promptSections?.find(
            (s) => s.key === "system"
        );
        expect(systemOverride).toBeUndefined(); // defaults to enabled

        // CLOSE THE LOOP: call buildSystemPrompt directly to verify that
        // the settings store override actually excludes the character section.
        // This catches integration bugs where chatStore reads overrides from
        // a stale copy of settings.
        const result = await buildSystemPrompt(
            {
                generationPrompt: "Base prompt.",
                character: {
                    id: "c1",
                    name: "TestChar",
                    description: "A test character",
                    specVersion: 0,
                    metadata: { license: "" },
                    prompt: {
                        description: "You are TestChar with a unique marker XYZ123.",
                        authorsNote: "",
                        lorebook: { config: {}, data: [] },
                    },
                    executables: {
                        runtimeSetting: { timeout: 30000 },
                        replaceHooks: { display: [], input: [], output: [], request: [] },
                    },
                    assets: { assets: [] },
                },
                persona: { name: "Test Persona", description: "Test persona desc" },
            },
            settings.value.prompt.promptSections
        );
        // Character section must be excluded (the unique marker XYZ123 should not appear)
        expect(result).not.toContain("XYZ123");
        // Base prompt section must still be present
        expect(result).toContain("Base prompt.");
    });
});
