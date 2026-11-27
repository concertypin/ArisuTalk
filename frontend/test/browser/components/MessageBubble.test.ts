import { test, expect, describe, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import type { ComponentProps } from "svelte";
import MessageBubble from "@/components/chat/MessageBubble.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { recordSubmitEvents } from "@test/utils/submitEvents";
import { softTest } from "@test/utils/softTest";

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
    test("renders markdown", () => {
        render(MessageBubble, { props: { message, isEditing: false, ...createHandlers() } });

        expect(screen.getByRole("strong")).toHaveTextContent("world");
    });

    test("keeps a single newline as a line break (chat-style markdown)", () => {
        render(MessageBubble, {
            props: {
                message: textMessage("first\nsecond"),
                isEditing: false,
                ...createHandlers(),
            },
        });

        expect(screen.getByRole("paragraph")).toContainHTML("first<br>second");
    });

    test("shows raw HTML in a message as text", () => {
        render(MessageBubble, {
            props: {
                message: textMessage("<thinking>plan</thinking>", "assistant"),
                isEditing: false,
                ...createHandlers(),
            },
        });

        expect(screen.getByText("<thinking>plan</thinking>")).toBeVisible();
    });

    test("drops javascript: URLs from links in a message", () => {
        render(MessageBubble, {
            props: {
                message: textMessage("[link](javascript:window.__xss=1)", "assistant"),
                isEditing: false,
                ...createHandlers(),
            },
        });

        expect(screen.getByText("link")).toBeVisible();
        expect(screen.getByText("link")).not.toHaveAttribute("href");
    });

    test("tells the parent to start editing when Edit is clicked", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: false, ...handlers } });

        await user.click(screen.getByRole("button", { name: "Edit message" }));

        expect(handlers.onEditStart).toHaveBeenCalledExactlyOnceWith("msg-1");
    });

    test("Escape cancels editing", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.click(screen.getByRole("textbox"));
        await user.keyboard("{Escape}");

        expect(handlers.onEditCancel).toHaveBeenCalledOnce();
        expect(handlers.onMessageUpdate).not.toHaveBeenCalled();
    });

    test("the cancel button cancels editing", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.click(screen.getByRole("button", { name: "Cancel edit (Esc)" }));

        expect(handlers.onEditCancel).toHaveBeenCalledOnce();
    });

    test("Enter in the edit box saves the edited text", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.type(screen.getByRole("textbox"), "edited");
        await user.keyboard("{Enter}");

        expect(handlers.onMessageUpdate).toHaveBeenCalledExactlyOnceWith("msg-1", "edited");
    });

    test("the save button saves the edited text", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.type(screen.getByRole("textbox"), "edited");
        await user.click(screen.getByRole("button", { name: "Save edit (Enter)" }));

        expect(handlers.onMessageUpdate).toHaveBeenCalledExactlyOnceWith("msg-1", "edited");
    });

    test("prevents the browser's default form submission", async () => {
        const user = userEvent.setup();
        const submitEvents = recordSubmitEvents();
        render(MessageBubble, { props: { message, isEditing: true, ...createHandlers() } });

        await user.type(screen.getByRole("textbox"), "edited");
        await user.keyboard("{Enter}");

        expect(submitEvents).toHaveLength(1);
        expect(submitEvents[0].defaultPrevented).toBe(true);
    });

    test("tells the parent to delete after the confirmation click", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: false, ...handlers } });

        await user.click(screen.getByRole("button", { name: "Delete message" }));
        await user.click(screen.getByRole("button", { name: "Click again to confirm delete" }));

        expect(handlers.onMessageDelete).toHaveBeenCalledExactlyOnceWith("msg-1");
    });

    test("tells the parent to regenerate an assistant message", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, {
            props: { message: textMessage("Hello", "assistant"), isEditing: false, ...handlers },
        });

        await user.click(screen.getByRole("button", { name: "Regenerate response" }));

        expect(handlers.onMessageRegenerate).toHaveBeenCalledExactlyOnceWith("msg-1");
    });

    test("clears the draft once the parent reports the save succeeded", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.type(screen.getByRole("textbox"), "edited");
        await user.keyboard("{Enter}");

        await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
    });

    test("keeps the draft when saving fails, so retrying never saves empty text", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        handlers.onMessageUpdate.mockResolvedValue(false);
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.type(screen.getByRole("textbox"), "edited");
        await user.keyboard("{Enter}");
        await waitFor(() => expect(handlers.onMessageUpdate).toHaveBeenCalledOnce());

        expect(screen.getByRole("textbox")).toHaveValue("edited");

        await user.keyboard("{Enter}");
        await waitFor(() => expect(handlers.onMessageUpdate).toHaveBeenCalledTimes(2));
        expect(handlers.onMessageUpdate).toHaveBeenNthCalledWith(1, "msg-1", "edited");
        expect(handlers.onMessageUpdate).toHaveBeenNthCalledWith(2, "msg-1", "edited");
    });

    test("ignores a second submit while the first save is still in flight", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        const pending = Promise.withResolvers<boolean>();
        handlers.onMessageUpdate.mockReturnValue(pending.promise);
        render(MessageBubble, { props: { message, isEditing: true, ...handlers } });

        await user.type(screen.getByRole("textbox"), "edited");
        await user.keyboard("{Enter}");
        await user.keyboard("{Enter}");
        pending.resolve(true);

        await waitFor(() => expect(screen.getByRole("textbox")).toHaveValue(""));
        expect(handlers.onMessageUpdate).toHaveBeenCalledOnce();
    });
});

describe("MessageBubble typography follows the theme", () => {
    // DaisyUI's `prose` follows the theme; a fixed text color would break contrast on some themes.
    softTest(
        "soft color check: markdown text uses theme-aware `prose` with no fixed colors",
        ({ warn }) => {
            render(MessageBubble, { props: { message, isEditing: false, ...createHandlers() } });
            const bubble = screen.getByTestId("message-bubble");
            // The message is "Hello **world**": a missing paragraph or <strong> must fail the query.
            const prose = screen.getByRole("paragraph").parentElement;
            const strong = screen.getByRole("strong");
            if (!prose) throw new Error("markdown element missing");

            const fixedColor = /\b(?:prose-(?:invert|slate|gray|zinc|neutral|stone)|text-)/;
            warn(() => expect(bubble.className).not.toMatch(fixedColor));
            warn(() => expect(prose).toHaveClass("prose"));
            warn(() => expect(prose.className).not.toMatch(fixedColor));
            warn(() => expect(strong.getAttribute("class") ?? "").not.toMatch(fixedColor));
            warn(() => expect(strong.getAttribute("style")).toBeNull());
        }
    );
});
