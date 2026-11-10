import { test, expect, describe, vi, afterEach } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import MessageBubble from "@/components/chat/MessageBubble.svelte";
import { MessageSchema } from "@arisutalk/character-spec/v0/Character/Message";
import { apply } from "@arisutalk/character-spec/utils";
import { applyTheme } from "@/lib/theme.svelte";
import { contrastRatio } from "@test/utils/color";

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
    afterEach(() => {
        document.documentElement.removeAttribute("data-theme");
        document.documentElement.style.colorScheme = "";
    });

    /** Renders a bubble under the given theme and returns its background and the markdown text colors. */
    function colorsUnder(mode: "light" | "dark") {
        applyTheme(mode);
        const screen = render(MessageBubble, {
            message,
            isEditing: false,
            ...createHandlers(),
        });
        const bubble = screen.container.querySelector(".chat-bubble");
        const prose = screen.container.querySelector(".prose");
        if (!bubble || !prose) throw new Error("bubble or markdown element missing");
        return {
            background: getComputedStyle(bubble).backgroundColor,
            body: getComputedStyle(prose).color,
            bold: getComputedStyle(prose.querySelector("strong") ?? prose).color,
        };
    }

    test.each(["light", "dark"] as const)("markdown text is readable in the %s theme", (mode) => {
        const colors = colorsUnder(mode);

        expect(contrastRatio(colors.body, colors.background)).toBeGreaterThan(4.5);
        expect(contrastRatio(colors.bold, colors.background)).toBeGreaterThan(4.5);
    });
});
