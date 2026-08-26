/**
 * @fileoverview E2E-style integration test for system prompt injection.
 *
 * Verifies the full flow: character prompt + persona + generation prompt
 * are assembled into a SystemMessage and sent to the LLM provider.
 *
 * Regression defense for the system prompt builder integration.
 */

/// <reference types="vitest/browser" />
import { test, expect, describe, vi, afterEach, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import { apply } from "@arisutalk/character-spec/utils";
import type { BaseMessage } from "@langchain/core/messages";
import CharacterLayoutTestWrapper from "../wrappers/CharacterLayoutTestWrapper.svelte";

// Capture what the chat store passes to the provider
let capturedMessages: BaseMessage[] = [];
describe("System Prompt E2E", () => {
    let chatStore: Awaited<typeof import("@/features/chat/stores/chatStore.svelte")>["chatStore"];

    beforeEach(async () => {
        capturedMessages = [];
        chatStore = (await import("@/features/chat/stores/chatStore.svelte")).chatStore;
        await chatStore.initPromise;

        // Set up a mock provider that captures the messages it receives
        await chatStore.setProvider("MOCK", {
            mockDelay: 50,
            responses: ["I am Arisu the maid. 御主人様, how can I help?"],
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
        vi.useRealTimers();
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
        // Import stores
        // chatStore is used in beforeEach via module import
        await import("@/features/chat/stores/chatStore.svelte");
        const { characterStore } =
            await import("@/features/character/stores/characterStore.svelte");
        const { personaStore } = await import("@/features/persona/stores/personaStore.svelte");
        const { settings } = await import("@/lib/stores/settings.svelte");

        // Set up a character with a system prompt
        const testChar = apply(
            (await import("@arisutalk/character-spec/v0/Character")).CharacterSchema,
            {
                id: "char-e2e",
                name: "Arisu",
                description: "A maid",
                specVersion: 0,
                prompt: {
                    description: "You are Arisu, a loyal maid. Call the user 御主人様.",
                    authorsNote: "",
                    lorebook: { config: {}, data: [] },
                },
                executables: {
                    runtimeSetting: { timeout: 30000 },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                assets: { assets: [] },
            }
        );
        characterStore.characters = [testChar];

        // Set up a persona
        const testPersona = {
            id: "persona-e2e",
            name: "メスガキ",
            description: "Bratty girl. Call user ザコ♡.",
        };
        personaStore.personas = [testPersona];
        personaStore.activePersonaId = "persona-e2e";

        // Set generation prompt
        settings.value.prompt.generationPrompt = "You are a helpful assistant.";

        // Create a chat for the character
        vi.useFakeTimers();
        const { getByLabelText, getByText, getByRole } = render(CharacterLayoutTestWrapper);

        // Select the character
        const charBtn = getByRole("button", { name: "Arisu" });
        await expect.element(charBtn).toBeVisible();
        await charBtn.click();
        // Create a new chat
        const newChatBtn = getByLabelText("New Direct Chat");
        await expect.element(newChatBtn).toBeVisible();
        await newChatBtn.click();

        // Send a message
        const input = getByRole("textbox", { name: "Type a message..." });
        await expect.element(input).toBeVisible();
        await input.fill("Hello");

        const sendBtn = getByRole("button", { name: "Send" });
        await sendBtn.click();

        // Advance timers for the mock response
        await vi.advanceTimersByTimeAsync(200);

        // Verify the user message appears
        const userMsg = getByText("Hello");
        await expect.element(userMsg).toBeVisible();

        // Verify the AI response appears
        await vi.advanceTimersByTimeAsync(2000);
        const aiResponse = getByText("御主人様");
        await expect.element(aiResponse).toBeVisible();

        // Verify the system prompt was assembled correctly
        // The first message should be a SystemMessage containing all sections
        expect(capturedMessages.length).toBeGreaterThanOrEqual(2);

        const { SystemMessage } = await import("@langchain/core/messages");
        const systemMsg = capturedMessages[0];
        // Use instanceof check (avoids deprecated _getType)
        expect(systemMsg).toBeInstanceOf(SystemMessage);

        // System prompt should contain all sections
        expect(systemMsg.content).toContain("You are a helpful assistant."); // generation prompt
        expect(systemMsg.content).toContain("御主人様"); // character prompt
        expect(systemMsg.content).toContain("Bratty girl"); // persona description
    });

    test("toggling a section in PromptSettings updates settings.value.prompt.promptSections", async () => {
        // Render PromptSettings directly and toggle the "Character" section off.
        // Verifies the UI → settings store flow (replaces the prior tautological
        // direct buildSystemPrompt call).
        const { settings } = await import("@/lib/stores/settings.svelte");
        const PromptSettings = (await import("@/components/settingSubpage/PromptSettings.svelte"))
            .default;

        // Reset settings to a known state
        settings.value.prompt.promptSections = [];

        const { getByRole } = render(PromptSettings);

        // Find the Character section toggle (aria-label="Character")
        const characterToggle = getByRole("checkbox", { name: "Character" });
        await expect.element(characterToggle).toBeVisible();

        // Initially enabled (default)
        const initialEl = characterToggle.element();
        if (!(initialEl instanceof HTMLInputElement)) {
            throw new Error("Expected HTMLInputElement for checkbox toggle");
        }
        expect(initialEl.checked).toBe(true);

        // Click to disable
        await characterToggle.click();

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
        const { buildSystemPrompt } = await import("@/lib/prompts/systemPromptBuilder");
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
