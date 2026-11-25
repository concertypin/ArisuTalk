import { test, expect, describe, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import TextArea from "@/components/input/TextArea.svelte";
import TextAreaFormTestWrapper from "@test/browser/wrappers/TextAreaFormTestWrapper.svelte";

describe("TextArea Component", () => {
    test("submits the surrounding form on Enter without clearing the text", async () => {
        const onSubmit = vi.fn();
        const screen = render(TextAreaFormTestWrapper, { onSubmit });
        const textarea = screen.getByRole("textbox");

        await textarea.fill("hello");
        await userEvent.keyboard("{Enter}");

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("hello");
        await expect.element(textarea).toHaveValue("hello");
    });

    test("does not submit on Shift+Enter", async () => {
        const onSubmit = vi.fn();
        const screen = render(TextAreaFormTestWrapper, { onSubmit });
        const textarea = screen.getByRole("textbox");

        await textarea.fill("line");
        await userEvent.keyboard("{Shift>}{Enter}{/Shift}");

        expect(onSubmit).not.toHaveBeenCalled();
        await expect.element(textarea).toHaveValue("line\n");
    });

    test.each<{ browser: string; init: KeyboardEventInit }>([
        { browser: "Chrome and Firefox (isComposing)", init: { isComposing: true } },
        { browser: "Safari (keyCode 229 after compositionend)", init: { keyCode: 229 } },
    ])("ignores the Enter that confirms an IME composition in $browser", async ({ init }) => {
        const onSubmit = vi.fn();
        const screen = render(TextAreaFormTestWrapper, { onSubmit });
        const textarea = screen.getByRole("textbox");
        await textarea.fill("한글");

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true,
            ...init,
        });
        textarea.element().dispatchEvent(event);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    test("Enter outside a form is left alone and inserts a newline", async () => {
        const screen = render(TextArea, {});
        const textarea = screen.getByRole("textbox");

        await textarea.fill("a");
        await userEvent.keyboard("{Enter}");

        await expect.element(textarea).toHaveValue("a\n");
    });

    test("passes enterkeyhint to the textarea", async () => {
        const screen = render(TextAreaFormTestWrapper, { onSubmit: vi.fn(), enterkeyhint: "send" });

        await expect.element(screen.getByRole("textbox")).toHaveAttribute("enterkeyhint", "send");
    });

    test("calls onCancel on Escape", async () => {
        const onCancel = vi.fn();
        const screen = render(TextArea, { onCancel });
        await screen.getByRole("textbox").click();

        await userEvent.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledOnce();
    });

    describe("sizing and wrapping", () => {
        /** The element under test, narrowed for DOM measurements. */
        function textareaOf(screen: ReturnType<typeof render>): HTMLTextAreaElement {
            const element = screen.getByRole("textbox").element();
            if (!(element instanceof HTMLTextAreaElement)) throw new Error("textarea expected");
            return element;
        }

        test("a long paste stops growing at a cap and scrolls", async () => {
            const screen = render(TextArea, {});
            const textarea = textareaOf(screen);

            const manyLines = Array.from({ length: 200 }, () => "line").join("\n");
            await screen.getByRole("textbox").fill(manyLines);

            // Without a cap, field-sizing grows the box to ~200 lines and pushes the chat away.
            expect(textarea.getBoundingClientRect().height).toBeLessThanOrEqual(
                window.innerHeight * 0.4 + 1
            );
            expect(getComputedStyle(textarea).overflowY).toBe("auto");
            expect(textarea.scrollHeight).toBeGreaterThan(textarea.clientHeight);
            textarea.scrollTop = textarea.scrollHeight;
            expect(textarea.scrollTop).toBeGreaterThan(0);
        });

        test("a single line stays compact", async () => {
            const screen = render(TextArea, {});
            const textarea = textareaOf(screen);

            await screen.getByRole("textbox").fill("one line");

            expect(textarea.getBoundingClientRect().height).toBeLessThan(window.innerHeight * 0.2);
        });

        test("does not break Latin words in the middle of a word", async () => {
            const screen = render(TextArea, {});

            const style = getComputedStyle(textareaOf(screen));

            expect(style.wordBreak).toBe("normal");
            // Wraps at spaces first and only splits a token that cannot fit on a line at all.
            expect(style.overflowWrap).toBe("anywhere");
        });

        test("a long unbroken string wraps instead of widening the box", async () => {
            const screen = render(TextArea, {});
            const textarea = textareaOf(screen);
            textarea.style.width = "12rem";

            await screen.getByRole("textbox").fill("x".repeat(300));

            expect(textarea.scrollWidth).toBeLessThanOrEqual(textarea.clientWidth);
        });

        const colors = [
            "neutral",
            "primary",
            "secondary",
            "accent",
            "info",
            "success",
            "warning",
            "error",
        ] as const;

        /** DaisyUI sets `--input-color` only when the generated CSS contains the color's class. */
        async function inputColorOf(color?: (typeof colors)[number]) {
            const screen = render(TextArea, { color });
            const inputColor = getComputedStyle(textareaOf(screen)).getPropertyValue(
                "--input-color"
            );
            await screen.unmount();
            return inputColor;
        }

        // The component spells every color class out so Tailwind's scan generates it.
        // A color whose class was never generated looks like no color at all.
        test.each(colors)("color %s changes the input color", async (color) => {
            expect(await inputColorOf(color)).not.toBe(await inputColorOf());
        });
    });
});
