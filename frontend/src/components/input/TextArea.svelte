<!--
  @component TextArea
  Auto-growing textarea. Inside a `<form>`, Enter submits the form (`requestSubmit()`),
  Shift+Enter inserts a newline and Escape cancels. The form's `onsubmit` decides what to do.
  An Enter press that confirms an IME composition (e.g. Korean) is ignored.
-->
<script lang="ts">
    import type { HTMLTextareaAttributes } from "svelte/elements";
    import { isComposing } from "@/lib/utils/keyboard";

    /**
     * Full class names are spelled out so Tailwind's source scan can generate them.
     * A template such as `textarea-${color}` would never be detected.
     */
    const colorClass = {
        neutral: "textarea-neutral",
        primary: "textarea-primary",
        secondary: "textarea-secondary",
        accent: "textarea-accent",
        info: "textarea-info",
        success: "textarea-success",
        warning: "textarea-warning",
        error: "textarea-error",
    } as const satisfies Record<string, string>;

    type Color = keyof typeof colorClass;

    type Props = {
        /** Current text. The component never clears it by itself. */
        value?: string;
        /** The underlying textarea element, for focus and selection control. */
        element?: HTMLTextAreaElement | null;
        /** Called when Escape is pressed. */
        onCancel?: () => void;
        disabled?: boolean;
        placeholder?: string | null;
        color?: Color;
        /** Label of the Enter key on virtual keyboards. */
        enterkeyhint?: HTMLTextareaAttributes["enterkeyhint"];
    };
    let {
        value = $bindable(""),
        element = $bindable(null),
        onCancel = () => undefined,
        disabled = false,
        placeholder,
        color,
        enterkeyhint,
    }: Props = $props();

    function onKeyDown(event: KeyboardEvent & { currentTarget: HTMLTextAreaElement }) {
        if (isComposing(event)) return;
        if (event.key === "Escape") {
            onCancel();
            return;
        }
        if (event.key !== "Enter" || event.shiftKey) return;

        const form = event.currentTarget.form;
        // Without a form there is nothing to submit, so Enter inserts a newline.
        if (!form) return;
        event.preventDefault();
        form.requestSubmit();
    }
</script>

<textarea
    bind:value
    bind:this={element}
    class={[
        "textarea font-sans flex-1 min-w-0 min-h-[1em] max-h-[40vh] field-sizing-content resize-none outline-none overflow-y-auto contain-layout wrap-anywhere line-clamp-none",
        color && colorClass[color],
    ]}
    spellcheck="false"
    {placeholder}
    {enterkeyhint}
    onkeydown={onKeyDown}
    {disabled}
></textarea>
