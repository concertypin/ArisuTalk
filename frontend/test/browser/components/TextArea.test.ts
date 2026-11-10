import { test, expect, describe, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import TextArea from "@/components/input/TextArea.svelte";

describe("TextArea Component", () => {
    test("submits the current text on Enter without clearing it", async () => {
        const onSubmit = vi.fn();
        const screen = render(TextArea, { onSubmit });
        const textarea = screen.getByRole("textbox");

        await textarea.fill("hello");
        await userEvent.keyboard("{Enter}");

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("hello");
        await expect.element(textarea).toHaveValue("hello");
    });

    test("does not submit on Shift+Enter", async () => {
        const onSubmit = vi.fn();
        const screen = render(TextArea, { onSubmit });
        const textarea = screen.getByRole("textbox");

        await textarea.fill("line");
        await userEvent.keyboard("{Shift>}{Enter}{/Shift}");

        expect(onSubmit).not.toHaveBeenCalled();
        await expect.element(textarea).toHaveValue("line\n");
    });

    test("does not stay stuck in newline mode after Shift is released elsewhere", async () => {
        const onSubmit = vi.fn();
        const screen = render(TextArea, { onSubmit });
        const textarea = screen.getByRole("textbox");
        await textarea.fill("text");

        // A keydown that reports shiftKey=false must submit, no matter what happened before.
        textarea
            .element()
            .dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }));
        textarea
            .element()
            .dispatchEvent(
                new KeyboardEvent("keydown", { key: "Enter", shiftKey: false, bubbles: true })
            );

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("text");
    });

    test("ignores the Enter that confirms an IME composition", async () => {
        const onSubmit = vi.fn();
        const screen = render(TextArea, { onSubmit });
        const textarea = screen.getByRole("textbox");
        await textarea.fill("한글");

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            isComposing: true,
            bubbles: true,
            cancelable: true,
        });
        textarea.element().dispatchEvent(event);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    test("calls onCancel on Escape", async () => {
        const onCancel = vi.fn();
        const screen = render(TextArea, { onCancel });
        await screen.getByRole("textbox").click();

        await userEvent.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledOnce();
    });

    test("reports typed text through onInput", async () => {
        const onInput = vi.fn();
        const screen = render(TextArea, { onInput });

        await screen.getByRole("textbox").fill("abc");

        expect(onInput).toHaveBeenLastCalledWith("abc");
    });
});
