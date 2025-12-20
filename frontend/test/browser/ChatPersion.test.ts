/// <reference types="vitest/browser" />
import { test, expect, describe, vi, afterEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterLayoutTestWrapper from "./CharacterLayoutTestWrapper.svelte";

describe("Persona and Chat interactions", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Manage Personas opens persona modal", async () => {
        const { getByLabelText, getByText } = render(CharacterLayoutTestWrapper);

        const personaBtn = getByLabelText("Manage Personas");
        await expect.element(personaBtn).toBeVisible();
        await personaBtn.click();

        const header = getByText("Manage Personas");
        await expect.element(header).toBeVisible();
    });

    test("Create character and send chat message", async () => {
        // Import and configure chatStore with Mock provider for testing
        // Must happen BEFORE fake timers are enabled
        const { chatStore } = await import("@/features/chat/stores/chatStore.svelte");
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", {
            mockDelay: 50,
            responses: ["Response 1", "Response 2"],
        });

        // Enable fake timers AFTER async initialization completes
        vi.useFakeTimers();

        const { getByLabelText, getByText, getByRole } = render(CharacterLayoutTestWrapper);

        // Open Add Character modal
        const addBtn = getByLabelText("Add Character");
        await expect.element(addBtn).toBeVisible();
        await addBtn.click();

        // Fill character form (input has id `char_name`)

        const nameInput = getByRole("textbox", { name: "e.g. Arisu" });
        await expect.element(nameInput).toBeVisible();
        await nameInput.fill("TestBot");

        const saveBtn = getByText("Save Character");
        await saveBtn.click();

        // Select the created character from the sidebar
        const charBtn = getByRole("button", { name: "TestBot" });
        await expect.element(charBtn).toBeVisible();
        await charBtn.click();

        // Create a new chat for the character so ChatArea becomes active
        const newChatBtn = getByLabelText("New Chat");
        await expect.element(newChatBtn).toBeVisible();
        await newChatBtn.click();

        // Send a user message (chat input uses placeholder)
        const input = getByRole("textbox", { name: "Type a message..." });
        await expect.element(input).toBeVisible();
        await input.fill("Hello there");

        const sendBtn = getByText("Send");
        await sendBtn.click();

        // User message appears
        const userMsg = getByText("Hello there");
        await expect.element(userMsg).toBeVisible();

        // Wait for the mocked bot response (the app uses a 1s delay)
        await vi.advanceTimersByTimeAsync(1200);
        const botMsg = getByText("Response 1");
        await expect.element(botMsg).toBeVisible();
    });
});
