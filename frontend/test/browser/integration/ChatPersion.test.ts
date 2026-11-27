import { test, expect, describe, vi, afterEach, beforeEach } from "vitest";
import { screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterLayoutTestWrapper from "@test/browser/wrappers/CharacterLayoutTestWrapper.svelte";
import { chatStore } from "@/features/chat/stores/chatStore.svelte";

describe("Persona and Chat interactions", () => {
    beforeEach(() => {
        // Reset chatStore state so each test starts clean
        if (chatStore["activeProvider"]) {
            chatStore["activeProvider"].disconnect = vi.fn().mockResolvedValue(undefined);
        }
        chatStore["activeProvider"] = null;
        chatStore.isGenerating = false;
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test("Manage Personas opens persona modal", async () => {
        const user = userEvent.setup();
        renderWithAppContext(CharacterLayoutTestWrapper, {});

        const personaBtn = screen.getByLabelText("Manage Personas");
        expect(personaBtn).toBeInTheDocument();
        await user.click(personaBtn);

        // Look for the modal heading specifically (h3 in the dialog)
        const header = screen.getByRole("heading", { name: "Manage Personas", level: 3 });
        expect(header).toBeInTheDocument();
    });

    test("Create character and send chat message", async () => {
        const user = userEvent.setup();
        // Configure chatStore with Mock provider for testing
        // Mock chatStore.waitForSettings to avoid delays
        vi.spyOn(chatStore, "waitForSettings").mockResolvedValue(undefined);
        await chatStore.initPromise;
        await chatStore.setProvider("MOCK", {
            // No per-character stream delay, so replies render within the findBy timeout.
            mockDelay: 0,
            responses: ["Response 1", "Response 2"],
            generationParameters: {},
        });

        renderWithAppContext(CharacterLayoutTestWrapper, {});

        // Open Add Character modal
        const addCharButton = screen.getByLabelText("Add Character");
        await user.click(addCharButton);

        const nameInput = screen.getByLabelText("Name");
        expect(nameInput).toBeInTheDocument();
        await fillText(user, nameInput, "TestBot");

        const saveBtn = screen.getByRole("button", { name: /Save Character/ });
        await user.click(saveBtn);

        // Select the created character from the sidebar
        const charBtn = screen.getByRole("button", { name: "TestBot" });
        expect(charBtn).toBeInTheDocument();
        await user.click(charBtn);

        // Create a new chat for the character so ChatArea becomes active
        const newChatBtn = screen.getByLabelText("New Direct Chat");
        expect(newChatBtn).toBeInTheDocument();
        await user.click(newChatBtn);

        // Send a user message (chat input uses placeholder)
        const input = screen.getByPlaceholderText("Type a message...");
        expect(input).toBeInTheDocument();
        await fillText(user, input, "Hello there");

        const sendBtn = screen.getByRole("button", { name: "Send" });
        await user.click(sendBtn);

        // User message appears
        const userMsg = await screen.findByText("Hello there");
        expect(userMsg).toBeInTheDocument();

        // Wait for the mocked bot response (real timers; findBy polls until it renders)
        const botMsg = await screen.findByText("Response 1", {}, { timeout: 5000 });
        expect(botMsg).toBeInTheDocument();
    });
});
