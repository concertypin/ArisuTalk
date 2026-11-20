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

    describe("sizing and wrapping", () => {
        /** The element under test, narrowed for DOM measurements. */
        function textareaOf(screen: ReturnType<typeof render>): HTMLTextAreaElement {
            const element = screen.getByRole("textbox").element();
            if (!(element instanceof HTMLTextAreaElement)) throw new Error("textarea expected");
            return element;
        }

        /**
         * DaisyUI's class for a color, assembled at runtime. Tailwind scans test files too, so a
         * spelled-out literal here would generate the class and hide a component that forgot to.
         */
        const colorClassName = (color: string) => ["textarea", color].join("-");

        test.each([true, false])(
            "a long paste stops growing at a cap and scrolls (autosize: %s)",
            async (autosize) => {
                const screen = render(TextArea, { autosize });
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
            }
        );

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

        test.each([
            "neutral",
            "primary",
            "secondary",
            "accent",
            "info",
            "success",
            "warning",
            "error",
        ] as const)("color %s is generated, not just named", async (color) => {
            const plain = render(TextArea, {});
            const plainStyle = getComputedStyle(textareaOf(plain));
            const base = plainStyle.getPropertyValue("--input-color");
            await plain.unmount();

            const colored = render(TextArea, { color });
            const coloredStyle = getComputedStyle(textareaOf(colored));

            expect(textareaOf(colored).classList.contains(colorClassName(color))).toBe(true);
            expect(coloredStyle.getPropertyValue("--input-color")).not.toBe(base);
        });

        test("no color class without a color", () => {
            const screen = render(TextArea, { color: null });

            expect(textareaOf(screen).className).not.toMatch(/textarea-/);
        });
    });
});
