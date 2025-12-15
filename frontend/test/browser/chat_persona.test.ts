import { test, expect, describe, beforeAll, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterLayoutTestWrapper from "./CharacterLayoutTestWrapper.svelte";
import { createLocalStorageMock } from "@test/utils/localStorageMock";

function setInputValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("Persona and Chat interactions", () => {
    test("Manage Personas opens persona modal", async () => {
        const { getByLabelText, getByText } = render(CharacterLayoutTestWrapper);

        const personaBtn = getByLabelText("Manage Personas");
        await expect.element(personaBtn).toBeVisible();
        await personaBtn.click();

        const header = getByText("Manage Personas");
        await expect.element(header).toBeVisible();
    });

    test("Create character and send chat message", async () => {
        const { container, getByLabelText, getByText, getByRole } = render(
            CharacterLayoutTestWrapper
        );

        // Open Add Character modal
        const addBtn = getByLabelText("Add Character");
        await expect.element(addBtn).toBeVisible();
        await addBtn.click();

        // Fill character form (input has id `char_name`)
        const nameInput = container.querySelector("#char_name") as HTMLInputElement | null;
        if (!nameInput) throw new Error("Name input not found");
        await expect.element(nameInput).toBeVisible();
        setInputValue(nameInput as HTMLInputElement, "TestBot");

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
        const input = container.querySelector(
            'input[placeholder="Type a message..."]'
        ) as HTMLInputElement | null;
        if (!input) throw new Error("Chat input not found");
        await expect.element(input).toBeVisible();
        setInputValue(input as HTMLInputElement, "Hello there");
        const sendBtn = getByText("Send");
        await sendBtn.click();

        // User message appears
        const userMsg = getByText("Hello there");
        await expect.element(userMsg).toBeVisible();

        // Wait for the mocked bot response (the app uses a 1s delay)
        await new Promise((r) => setTimeout(r, 1200));
        const botMsg = getByText("This is a mock response from the system.");
        await expect.element(botMsg).toBeVisible();
    });
});
