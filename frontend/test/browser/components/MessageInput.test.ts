import { test, expect, describe, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import MessageInput from "@/components/chat/MessageInput.svelte";

describe("MessageInput Component", () => {
    test("Send button submits the text and clears the input", async () => {
        const onSubmit = vi.fn();
        const screen = render(MessageInput, { onSubmit });
        const input = screen.getByRole("textbox");

        await input.fill("Hello");
        await screen.getByRole("button", { name: "Send" }).click();

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Hello");
        await expect.element(input).toHaveValue("");
    });

    test("Enter submits the text and clears the input like the Send button", async () => {
        const onSubmit = vi.fn();
        const screen = render(MessageInput, { onSubmit });
        const input = screen.getByRole("textbox");

        await input.fill("Hello");
        await userEvent.keyboard("{Enter}");

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("Hello");
        await expect.element(input).toHaveValue("");
    });

    test("Send button is disabled for blank text", async () => {
        const screen = render(MessageInput, { onSubmit: vi.fn() });

        await expect.element(screen.getByRole("button", { name: "Send" })).toBeDisabled();

        await screen.getByRole("textbox").fill("   ");

        await expect.element(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    });

    test("cannot send while generating, and keeps the draft", async () => {
        const onSubmit = vi.fn();
        const screen = render(MessageInput, { onSubmit, isGenerating: true });
        const input = screen.getByRole("textbox");

        await input.fill("draft");
        await expect.element(screen.getByRole("button", { name: "Send" })).toBeDisabled();

        await userEvent.keyboard("{Enter}");

        expect(onSubmit).not.toHaveBeenCalled();
        await expect.element(input).toHaveValue("draft");
    });

    test("is fully disabled when disabled", async () => {
        const screen = render(MessageInput, { onSubmit: vi.fn(), disabled: true });

        await expect.element(screen.getByRole("textbox")).toBeDisabled();
        await expect.element(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    });

    test("inserts the picked emoji at the cursor", async () => {
        const screen = render(MessageInput, { onSubmit: vi.fn() });
        const input = screen.getByRole("textbox");
        await input.fill("ab");
        const textarea = input.element();
        if (!(textarea instanceof HTMLTextAreaElement)) throw new Error("textarea expected");
        textarea.setSelectionRange(1, 1);

        await screen.getByRole("button", { name: "Pick emoji" }).click();
        await screen.getByPlaceholder("Search emoji...").fill("grinning face");
        await screen.getByRole("button", { name: "😀" }).first().click();

        await expect.element(input).toHaveValue("a😀b");
    });

    test("appends the picked emoji when nothing was typed", async () => {
        const screen = render(MessageInput, { onSubmit: vi.fn() });

        await screen.getByRole("button", { name: "Pick emoji" }).click();
        await screen.getByPlaceholder("Search emoji...").fill("grinning face");
        await screen.getByRole("button", { name: "😀" }).first().click();

        await expect.element(screen.getByRole("textbox")).toHaveValue("😀");
    });
});
