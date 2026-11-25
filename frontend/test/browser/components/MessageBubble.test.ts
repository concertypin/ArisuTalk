import { test, expect, describe, vi, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import type { ComponentProps } from "svelte";
import MessageBubble from "@/components/chat/MessageBubble.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { applyTheme } from "@/lib/theme.svelte";
import { contrastRatio } from "@test/utils/color";
import { recordSubmitEvents } from "@test/utils/submitEvents";

/** Builds a text message with the id the tests expect the parent to receive. */
function textMessage(data: string, role: "user" | "assistant" = "user") {
    return apply(MessageSchema, {
        id: "msg-1",
        role,
        content: { type: "text", data },
        chatId: "chat-1",
    });
}

const message = textMessage("Hello **world**");

function createHandlers() {
    return {
        onEditStart: vi.fn(),
        onEditCancel: vi.fn(),
        onMessageUpdate: vi.fn<(id: string, content: string) => Promise<boolean>>(() =>
            Promise.resolve(true)
        ),
        onMessageDelete: vi.fn(),
        onMessageRegenerate: vi.fn(),
    } satisfies Partial<ComponentProps<typeof MessageBubble>>;
}

describe("MessageBubble Component", () => {
    test("renders markdown", async () => {
        const screen = render(MessageBubble, { message, isEditing: false, ...createHandlers() });

        await expect.element(screen.getByRole("strong")).toHaveTextContent("world");
    });

    test("keeps a single newline as a line break (chat-style markdown)", async () => {
        const screen = render(MessageBubble, {
            message: textMessage("first\nsecond"),
            isEditing: false,
            ...createHandlers(),
        });

        await expect.element(screen.getByRole("paragraph")).toContainHTML("first<br>second");
    });

    test("shows raw HTML in a message as text", async () => {
        const screen = render(MessageBubble, {
            message: textMessage("<thinking>plan</thinking>", "assistant"),
            isEditing: false,
            ...createHandlers(),
        });

        await expect.element(screen.getByText("<thinking>plan</thinking>")).toBeVisible();
    });

    test("drops javascript: URLs from links in a message", async () => {
        const screen = render(MessageBubble, {
            message: textMessage("[link](javascript:window.__xss=1)", "assistant"),
            isEditing: false,
            ...createHandlers(),
        });

        await expect.element(screen.getByText("link")).toBeVisible();
        await expect.element(screen.getByText("link")).not.toHaveAttribute("href");
    });

    test("tells the parent to start editing when Edit is clicked", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: false, ...handlers });

        await screen.getByRole("button", { name: "Edit message" }).click();

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

        await screen.getByRole("button", { name: "Cancel edit (Esc)" }).click();

        expect(handlers.onEditCancel).toHaveBeenCalledOnce();
    });

    test("Enter in the edit box saves the edited text", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").fill("edited");
        await userEvent.keyboard("{Enter}");

        expect(handlers.onMessageUpdate).toHaveBeenCalledExactlyOnceWith("msg-1", "edited");
    });

    test("the save button saves the edited text", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").fill("edited");
        await screen.getByRole("button", { name: "Save edit (Enter)" }).click();

        expect(handlers.onMessageUpdate).toHaveBeenCalledExactlyOnceWith("msg-1", "edited");
    });

    test("prevents the browser's default form submission", async () => {
        const submitEvents = recordSubmitEvents();
        const screen = render(MessageBubble, {
            message,
            isEditing: true,
            ...createHandlers(),
        });

        await screen.getByRole("textbox").fill("edited");
        await userEvent.keyboard("{Enter}");

        expect(submitEvents).toHaveLength(1);
        expect(submitEvents[0].defaultPrevented).toBe(true);
    });

    test("tells the parent to delete after the confirmation click", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: false, ...handlers });

        await screen.getByRole("button", { name: "Delete message" }).click();
        await screen.getByRole("button", { name: "Click again to confirm delete" }).click();

        expect(handlers.onMessageDelete).toHaveBeenCalledExactlyOnceWith("msg-1");
    });

    test("tells the parent to regenerate an assistant message", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, {
            message: textMessage("Hello", "assistant"),
            isEditing: false,
            ...handlers,
        });

        await screen.getByRole("button", { name: "Regenerate response" }).click();

        expect(handlers.onMessageRegenerate).toHaveBeenCalledExactlyOnceWith("msg-1");
    });

    test("clears the draft once the parent reports the save succeeded", async () => {
        const handlers = createHandlers();
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").fill("edited");
        await userEvent.keyboard("{Enter}");

        await expect.element(screen.getByRole("textbox")).toHaveValue("");
    });

    test("keeps the draft when saving fails, so retrying never saves empty text", async () => {
        const handlers = createHandlers();
        handlers.onMessageUpdate.mockResolvedValue(false);
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").fill("edited");
        await userEvent.keyboard("{Enter}");
        await vi.waitFor(() => expect(handlers.onMessageUpdate).toHaveBeenCalledOnce());

        await expect.element(screen.getByRole("textbox")).toHaveValue("edited");

        await userEvent.keyboard("{Enter}");
        await vi.waitFor(() => expect(handlers.onMessageUpdate).toHaveBeenCalledTimes(2));
        expect(handlers.onMessageUpdate).toHaveBeenNthCalledWith(1, "msg-1", "edited");
        expect(handlers.onMessageUpdate).toHaveBeenNthCalledWith(2, "msg-1", "edited");
    });

    test("ignores a second submit while the first save is still in flight", async () => {
        const handlers = createHandlers();
        const pending = Promise.withResolvers<boolean>();
        handlers.onMessageUpdate.mockReturnValue(pending.promise);
        const screen = render(MessageBubble, { message, isEditing: true, ...handlers });

        await screen.getByRole("textbox").fill("edited");
        await userEvent.keyboard("{Enter}");
        await userEvent.keyboard("{Enter}");
        pending.resolve(true);

        await expect.element(screen.getByRole("textbox")).toHaveValue("");
        expect(handlers.onMessageUpdate).toHaveBeenCalledOnce();
    });
});

describe("MessageBubble typography follows the theme", () => {
    /** Renders a bubble under the given theme and returns its background and the markdown text colors. */
    function colorsUnder(mode: "light" | "dark") {
        applyTheme(mode);
        onTestFinished(() => {
            document.documentElement.removeAttribute("data-theme");
            document.documentElement.style.colorScheme = "";
        });
        const screen = render(MessageBubble, {
            message,
            isEditing: false,
            ...createHandlers(),
        });
        // The message is "Hello **world**": a missing <strong> or paragraph must fail the locator.
        const bubble = screen.getByTestId("message-bubble").element();
        const paragraph = screen.getByRole("paragraph").element();
        const strong = screen.getByRole("strong").element();
        return {
            background: getComputedStyle(bubble).backgroundColor,
            body: getComputedStyle(paragraph).color,
            bold: getComputedStyle(strong).color,
        };
    }

    test.each(["light", "dark"] as const)("markdown text is readable in the %s theme", (mode) => {
        const colors = colorsUnder(mode);

        expect(contrastRatio(colors.body, colors.background)).toBeGreaterThan(4.5);
        expect(contrastRatio(colors.bold, colors.background)).toBeGreaterThan(4.5);
    });
});
