/// <reference types="vitest/browser" />
import { test, expect, describe, vi, afterEach, beforeEach } from "vitest";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterLayoutTestWrapper from "../wrappers/CharacterLayoutTestWrapper.svelte";

describe("Persona and Chat interactions", () => {
    beforeEach(async () => {
        // Reset chatStore state so each test starts clean
        try {
            const { chatStore } = await import("@/features/chat/stores/chatStore.svelte");
            if (chatStore["activeProvider"]) {
                chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
            }
            chatStore["activeProvider"] = null;
            chatStore.isGenerating = false;
        } catch {
            // chatStore may not load in all environments
        }
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Manage Personas opens persona modal", async () => {
        const { getByLabelText, getByRole } = renderWithAppContext(CharacterLayoutTestWrapper, {});

        const personaBtn = getByLabelText("Manage Personas");
        await expect.element(personaBtn).toBeVisible();
        await personaBtn.click();

        // Look for the modal heading specifically (h3 in the dialog)
        const header = getByRole("heading", { name: "Manage Personas", level: 3 });
        await expect.element(header).toBeVisible();
    });

    test("Create character and send chat message", async () => {
        // Import and configure chatStore with Mock provider for testing
        // Mock chatStore.waitForSettings to avoid delays

        const { chatStore } = await import("@/features/chat/stores/chatStore.svelte");
        // Mock chatStore.waitForSettings to avoid delays
        vi.spyOn(chatStore, "waitForSettings").mockResolvedValue(undefined);
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", {
            // No per-character stream delay, so replies render within the expect.element poll timeout.
            mockDelay: 0,
            responses: ["Response 1", "Response 2"],
            generationParameters: {},
        });

        const { getByLabelText, getByText, getByRole } = renderWithAppContext(
            CharacterLayoutTestWrapper,
            {}
        );

        // Open Add Character modal
        const addCharButton = getByLabelText("Add Character");
        await addCharButton.click();

        const nameInput = getByLabelText("Name");
        await expect.element(nameInput).toBeVisible();
        await nameInput.fill("TestBot");

        const saveBtn = getByText("Save Character");
        await saveBtn.click();

        // Select the created character from the sidebar
        const charBtn = getByRole("button", { name: "TestBot" });
        await expect.element(charBtn).toBeVisible();
        await charBtn.click();

        // Create a new chat for the character so ChatArea becomes active
        const newChatBtn = getByLabelText("New Direct Chat");
        await expect.element(newChatBtn).toBeVisible();
        await newChatBtn.click();

        // Send a user message (chat input uses placeholder)
        const input = getByRole("textbox", { name: "Type a message..." });
        await expect.element(input).toBeVisible();
        await input.fill("Hello there");

        // Use getByRole for more robust button selection - Svelte Inspector can intercept getByText
        const sendBtn = getByRole("button", { name: "Send" });
        // Use element() to get the raw element and click it directly to bypass Svelte Inspector interference
        const buttonElement = sendBtn.element() as HTMLButtonElement;
        buttonElement.click();

        // User message appears
        const userMsg = getByText("Hello there");
        await expect.element(userMsg).toBeVisible();

        // Wait for the mocked bot response (real timers; expect.element polls until it renders)
        const botMsg = getByText("Response 1");
        await expect.element(botMsg).toBeVisible();
    });
});
