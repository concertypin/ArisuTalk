import { test, expect, describe, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import MessageBubble from "@/components/chat/MessageBubble.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";

const message = apply(MessageSchema, {
    id: "msg-1",
    role: "user",
    content: { type: "text", data: "Hello **world**" },
    chatId: "chat-1",
});

function createHandlers() {
    return {
        onEditStart: vi.fn(),
        onEditCancel: vi.fn(),
        onMessageUpdate: vi.fn(),
        onMessageDelete: vi.fn(),
        onMessageRegenerate: vi.fn(),
    };
}

describe("MessageBubble Component", () => {
    test("renders markdown as sanitized HTML", async () => {
        const screen = render(MessageBubble, { message, isEditing: false, ...createHandlers() });

        await expect.element(screen.getByText("world")).toBeVisible();
        expect(screen.container.querySelector("strong")?.textContent).toBe("world");
    });

    test("does not keep event handler attributes from HTML embedded in a message", async () => {
        const evil = apply(MessageSchema, {
            id: "msg-2",
            role: "assistant",
            content: { type: "text", data: `<img src="x" onerror="window.__xss = 1">hi` },
            chatId: "chat-1",
        });
        const screen = render(MessageBubble, {
            message: evil,
            isEditing: false,
            ...createHandlers(),
        });

        await expect.element(screen.getByText("hi")).toBeVisible();
        expect(screen.container.querySelector("img")?.hasAttribute("onerror")).toBe(false);
    });

    test("tells the parent to start editing when Edit is clicked", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: false, ...handlers });

        await screen.getByTitle("Edit message").click();

        expect(handlers.onEditStart).toHaveBeenCalledExactlyOnceWith("msg-1");
    });

    test("Escape cancels editing", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").click();
        await userEvent.keyboard("{Escape}");

        expect(handlers.onEditCancel).toHaveBeenCalledOnce();
        expect(handlers.onMessageUpdate).not.toHaveBeenCalled();
    });

    test("the cancel button cancels editing", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByTitle("Cancel edit (Esc)").click();

        expect(handlers.onEditCancel).toHaveBeenCalledOnce();
    });

    test("Enter in the edit box saves the edited text", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").fill("edited");
        await userEvent.keyboard("{Enter}");

        expect(handlers.onMessageUpdate).toHaveBeenCalledExactlyOnceWith("msg-1", "edited");
    });
});
