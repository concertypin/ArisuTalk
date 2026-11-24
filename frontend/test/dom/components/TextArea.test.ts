import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import TextArea from "@/components/input/TextArea.svelte";
import { softTest } from "@test/utils/softTest";

describe("TextArea Component", () => {
    test("submits the current text on Enter without clearing it", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextArea, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");

        await user.type(textarea, "hello");
        await user.keyboard("{Enter}");

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("hello");
        expect(textarea).toHaveValue("hello");
    });

    test("does not submit on Shift+Enter", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextArea, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");

        await user.type(textarea, "line");
        await user.keyboard("{Shift>}{Enter}{/Shift}");

        expect(onSubmit).not.toHaveBeenCalled();
        expect(textarea).toHaveValue("line\n");
    });

    test("does not stay stuck in newline mode after Shift is released elsewhere", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextArea, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "text");

        // A keydown that reports shiftKey=false must submit, no matter what happened before.
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }));
        textarea.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", shiftKey: false, bubbles: true })
        );

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("text");
    });

    test("ignores the Enter that confirms an IME composition", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextArea, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "한글");

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            isComposing: true,
            bubbles: true,
            cancelable: true,
        });
        // Guard against an environment that drops `isComposing`, which would make this test vacuous.
        expect(event.isComposing).toBe(true);
        textarea.dispatchEvent(event);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    test("calls onCancel on Escape", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        render(TextArea, { props: { onCancel } });
        await user.click(screen.getByRole("textbox"));

        await user.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledOnce();
    });

    test("reports typed text through onInput", async () => {
        const user = userEvent.setup();
        const onInput = vi.fn();
        render(TextArea, { props: { onInput } });

        await user.type(screen.getByRole("textbox"), "abc");

        expect(onInput).toHaveBeenLastCalledWith("abc");
    });

    // jsdom does no layout, so the sizing behavior (field-sizing, overflow, wrapping) cannot be
    // measured. These tests pin the classes that produce it instead; the real rendering is not checked.
    describe("sizing and wrapping", () => {
        /** The element under test, narrowed for DOM assertions. */
        function textareaOf(): HTMLTextAreaElement {
            const element = screen.getByRole("textbox");
            if (!(element instanceof HTMLTextAreaElement)) throw new Error("textarea expected");
            return element;
        }

        test.each([true, false])(
            "caps the height and scrolls instead of growing (autosize: %s)",
            (autosize) => {
                render(TextArea, { props: { autosize } });

                // Without a cap, field-sizing grows the box with a long paste and pushes the chat away.
                expect(textareaOf()).toHaveClass("max-h-[40vh]", "overflow-y-auto");
            }
        );

        test("grows with its content from a one-line minimum, up to the cap", () => {
            render(TextArea, {});

            expect(textareaOf()).toHaveClass("field-sizing-content", "min-h-[1em]", "max-h-[40vh]");
        });

        test("does not break Latin words in the middle of a word", () => {
            render(TextArea, {});

            // `wrap-anywhere` wraps at spaces first and only splits a token that cannot fit on a
            // line at all. A forced `break-all` would split words mid-word.
            expect(textareaOf()).toHaveClass("wrap-anywhere");
            expect(textareaOf()).not.toHaveClass("break-all");
            expect(textareaOf()).not.toHaveClass("break-words");
        });

        test("lets a long unbroken string wrap instead of widening the box", () => {
            render(TextArea, {});

            // `wrap-anywhere` lets the long token wrap, `min-w-0` lets the flex item shrink.
            expect(textareaOf()).toHaveClass("wrap-anywhere", "min-w-0");
        });

        // Soft check: a color class on the element does not prove that Tailwind generated its CSS,
        // and the color itself cannot be seen without a real browser. A mismatch is reported as a
        // CI warning, not a failure. (`test/unit/components/TextAreaColorClasses.test.ts` reads the
        // source for the complete class names, which Tailwind's scan needs.)
        // The class is built from a template here on purpose: a spelled-out `textarea-primary` in
        // this file would make Tailwind generate the class and hide a component that forgot to.
        softTest.for([
            "neutral",
            "primary",
            "secondary",
            "accent",
            "info",
            "success",
            "warning",
            "error",
        ] as const)(
            "soft color check: color %s is applied as its DaisyUI class",
            (color, { warn }) => {
                render(TextArea, { props: { color } });

                expect(textareaOf()).toHaveClass("textarea");
                warn(() => expect(textareaOf()).toHaveClass(`textarea-${color}`));
            }
        );

        softTest("soft color check: no color class without a color", ({ warn }) => {
            render(TextArea, { props: { color: null } });

            expect(textareaOf()).toHaveClass("textarea");
            warn(() => expect(textareaOf().className).not.toMatch(/textarea-/));
        });
    });
});
