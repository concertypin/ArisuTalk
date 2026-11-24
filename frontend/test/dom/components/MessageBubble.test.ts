import { test, expect, describe, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MessageBubble from "@/components/chat/MessageBubble.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { softTest } from "@test/utils/softTest";

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
        onMessageUpdate: vi.fn<(id: string, content: string) => Promise<boolean>>(() =>
            Promise.resolve(true)
        ),
        onMessageDelete: vi.fn(),
        onMessageRegenerate: vi.fn(),
    };
}

describe("MessageBubble Component", () => {
    test("renders markdown as sanitized HTML", () => {
        const { container } = render(MessageBubble, {
            props: { message, isEditing: false, ...createHandlers() },
        });

        expect(screen.getByText("world")).toBeInTheDocument();
        expect(container.querySelector("strong")?.textContent).toBe("world");
    });

    test("keeps a single newline as a line break (chat-style markdown)", () => {
        const multiline = apply(MessageSchema, {
            id: "msg-3",
            role: "user",
            content: { type: "text", data: "first\nsecond" },
            chatId: "chat-1",
        });
        const { container } = render(MessageBubble, {
            props: { message: multiline, isEditing: false, ...createHandlers() },
        });

        expect(screen.getByText(/second/)).toBeInTheDocument();
        expect(container.querySelectorAll(".prose br")).toHaveLength(1);
    });

    test("does not keep event handler attributes from HTML embedded in a message", () => {
        const evil = apply(MessageSchema, {
            id: "msg-2",
            role: "assistant",
            content: { type: "text", data: `<img src="x" onerror="window.__xss = 1">hi` },
            chatId: "chat-1",
        });
        const { container } = render(MessageBubble, {
            props: { message: evil, isEditing: false, ...createHandlers() },
        });

        expect(screen.getByText("hi")).toBeInTheDocument();
        expect(container.querySelector("img")?.hasAttribute("onerror")).toBe(false);
    });

    test("tells the parent to start editing when Edit is clicked", async () => {
        const user = userEvent.setup();
        const handlers = createHandlers();
        render(MessageBubble, { props: { message, isEditing: false, ...handlers } });

        await user.click(screen.getByTitle("Edit message"));

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

        await user.click(screen.getByTitle("Cancel edit (Esc)"));

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
    // Soft check: jsdom loads no stylesheet, so the contrast of the text on the bubble cannot be
    // measured. DaisyUI maps `prose` to the theme's `base-content` color, so markdown text stays
    // readable on every theme as long as the elements use plain `prose` and pin no text color of
    // their own. Class names only hint at that, so a mismatch is a CI warning, not a failure.
    softTest(
        "soft color check: markdown text uses theme-aware `prose` with no fixed colors",
        ({ warn }) => {
            const { container } = render(MessageBubble, {
                props: { message, isEditing: false, ...createHandlers() },
            });
            const bubble = container.querySelector(".chat-bubble");
            const prose = container.querySelector(".prose");
            if (!bubble || !prose) throw new Error("bubble or markdown element missing");
            // The message is "Hello **world**": a missing <strong> must fail, not fall back to `prose`.
            const strong = prose.querySelector("strong");
            if (!strong) throw new Error("bold text element missing");

            const fixedColor = /\b(?:prose-(?:invert|slate|gray|zinc|neutral|stone)|text-)/;
            warn(() => expect(bubble.className).not.toMatch(fixedColor));
            warn(() => expect(prose.className).not.toMatch(fixedColor));
            warn(() => expect(strong.getAttribute("class") ?? "").not.toMatch(fixedColor));
            warn(() => expect(strong.getAttribute("style")).toBeNull());
        }
    );
});
