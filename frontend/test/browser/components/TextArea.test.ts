import { test, expect, describe, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import TextArea from "@/components/input/TextArea.svelte";
import TextAreaFormTestWrapper from "@test/browser/wrappers/TextAreaFormTestWrapper.svelte";
import { softTest } from "@test/utils/softTest";

describe("TextArea Component", () => {
    test("submits the surrounding form on Enter without clearing the text", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextAreaFormTestWrapper, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");

        await user.type(textarea, "hello");
        await user.keyboard("{Enter}");

        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("hello");
        expect(textarea).toHaveValue("hello");
    });

    test("does not submit on Shift+Enter", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextAreaFormTestWrapper, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");

        await user.type(textarea, "line");
        await user.keyboard("{Shift>}{Enter}{/Shift}");

        expect(onSubmit).not.toHaveBeenCalled();
        expect(textarea).toHaveValue("line\n");
    });

    test.each<{ browser: string; init: KeyboardEventInit }>([
        { browser: "Chrome and Firefox (isComposing)", init: { isComposing: true } },
        { browser: "Safari (keyCode 229 after compositionend)", init: { keyCode: 229 } },
    ])("ignores the Enter that confirms an IME composition in $browser", async ({ init }) => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(TextAreaFormTestWrapper, { props: { onSubmit } });
        const textarea = screen.getByRole("textbox");
        await user.type(textarea, "한글");

        const event = new KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true,
            ...init,
        });
        // Fails if the environment drops the init, which would make this test vacuous.
        expect(event).toMatchObject(init);
        textarea.dispatchEvent(event);

        expect(onSubmit).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    test("Enter outside a form is left alone and inserts a newline", async () => {
        const user = userEvent.setup();
        render(TextArea, {});
        const textarea = screen.getByRole("textbox");

        await user.type(textarea, "a");
        await user.keyboard("{Enter}");

        expect(textarea).toHaveValue("a\n");
    });

    test("passes enterkeyhint to the textarea", () => {
        render(TextAreaFormTestWrapper, { props: { onSubmit: vi.fn(), enterkeyhint: "send" } });

        expect(screen.getByRole("textbox")).toHaveAttribute("enterkeyhint", "send");
    });

    test("calls onCancel on Escape", async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        render(TextArea, { props: { onCancel } });
        await user.click(screen.getByRole("textbox"));

        await user.keyboard("{Escape}");

        expect(onCancel).toHaveBeenCalledOnce();
    });

    // jsdom does no layout, so these tests pin the classes, not the rendered size.
    describe("sizing and wrapping", () => {
        function textareaOf(): HTMLTextAreaElement {
            const element = screen.getByRole("textbox");
            if (!(element instanceof HTMLTextAreaElement)) throw new Error("textarea expected");
            return element;
        }

        test("caps the height and scrolls instead of growing", () => {
            render(TextArea, {});

            // Without a cap, field-sizing grows the box with a long paste and pushes the chat away.
            expect(textareaOf()).toHaveClass("max-h-[40vh]", "overflow-y-auto");
        });

        test("grows with its content from a one-line minimum, up to the cap", () => {
            render(TextArea, {});

            expect(textareaOf()).toHaveClass("field-sizing-content", "min-h-[1em]", "max-h-[40vh]");
        });

        test("does not break Latin words in the middle of a word", () => {
            render(TextArea, {});

            // `break-all` splits words mid-word; `wrap-anywhere` splits only a token that cannot fit.
            expect(textareaOf()).toHaveClass("wrap-anywhere");
            expect(textareaOf()).not.toHaveClass("break-all");
            expect(textareaOf()).not.toHaveClass("break-words");
        });

        test("lets a long unbroken string wrap instead of widening the box", () => {
            render(TextArea, {});

            // `wrap-anywhere` lets the long token wrap, `min-w-0` lets the flex item shrink.
            expect(textareaOf()).toHaveClass("wrap-anywhere", "min-w-0");
        });

        // Template on purpose: a literal class name here would make Tailwind generate it.
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
            render(TextArea, {});

            expect(textareaOf()).toHaveClass("textarea");
            warn(() => expect(textareaOf().className).not.toMatch(/textarea-/));
        });
    });
});
