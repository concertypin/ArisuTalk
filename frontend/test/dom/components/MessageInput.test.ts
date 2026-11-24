import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import MessageInput from "@/components/chat/MessageInput.svelte";

describe("MessageInput Component", () => {
    test("Send button submits the text and clears the input", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(MessageInput, { props: { onSubmit } });
        const input = screen.getByRole("textbox");

        await user.type(input, "Hello");
        await user.click(screen.getByRole("button", { name: "Send" }));

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Hello");
        expect(input).toHaveValue("");
    });

    test("Enter submits the text and clears the input like the Send button", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(MessageInput, { props: { onSubmit } });
        const input = screen.getByRole("textbox");

        await user.type(input, "Hello");
        await user.keyboard("{Enter}");

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Hello");
        expect(input).toHaveValue("");
    });

    test("Send button is disabled for blank text", async () => {
        const user = userEvent.setup();
        render(MessageInput, { props: { onSubmit: vi.fn() } });

        expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

        await user.type(screen.getByRole("textbox"), "   ");

        expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    });

    test("cannot send while generating, and keeps the draft", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(MessageInput, { props: { onSubmit, isGenerating: true } });
        const input = screen.getByRole("textbox");

        await user.type(input, "draft");
        expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

        await user.keyboard("{Enter}");

        expect(onSubmit).not.toHaveBeenCalled();
        expect(input).toHaveValue("draft");
    });

    test("is fully disabled when disabled", () => {
        render(MessageInput, { props: { onSubmit: vi.fn(), disabled: true } });

        expect(screen.getByRole("textbox")).toBeDisabled();
        expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    });

    test("inserts the picked emoji at the cursor", async () => {
        const user = userEvent.setup();
        render(MessageInput, { props: { onSubmit: vi.fn() } });
        const input = screen.getByRole("textbox");
        await user.type(input, "ab");
        if (!(input instanceof HTMLTextAreaElement)) throw new Error("textarea expected");
        input.setSelectionRange(1, 1);

        await user.click(screen.getByRole("button", { name: "Pick emoji" }));
        await user.type(await screen.findByPlaceholderText("Search emoji..."), "grinning face");
        const [emojiButton] = await screen.findAllByRole("button", { name: "😀" });
        await user.click(emojiButton);

        expect(input).toHaveValue("a😀b");
    });

    test("appends the picked emoji when nothing was typed", async () => {
        const user = userEvent.setup();
        render(MessageInput, { props: { onSubmit: vi.fn() } });

        await user.click(screen.getByRole("button", { name: "Pick emoji" }));
        await user.type(await screen.findByPlaceholderText("Search emoji..."), "grinning face");
        const [emojiButton] = await screen.findAllByRole("button", { name: "😀" });
        await user.click(emojiButton);

        expect(screen.getByRole("textbox")).toHaveValue("😀");
    });
});
