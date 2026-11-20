<!--
  @component TextArea
  Auto-growing textarea. Enter submits, Shift+Enter inserts a newline, Escape cancels.
  Enter presses that confirm an IME composition (e.g. Korean) are ignored.
-->
<script lang="ts">
    type Color =
        | "neutral"
        | "primary"
        | "secondary"
        | "accent"
        | "info"
        | "success"
        | "warning"
        | "error"
        | null;

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
    } as const satisfies Record<NonNullable<Color>, string>;

    let {
        value = $bindable(""),
        element = $bindable(null),
        onInput = () => undefined,
        onSubmit = () => undefined,
        onCancel = () => undefined,
        disabled = false,
        placeholder,
        color,
        autosize = true,
    }: {
        /** Current text. The component never clears it by itself. */
        value?: string;
        /** The underlying textarea element, for focus and selection control. */
        element?: HTMLTextAreaElement | null;
        /** Called with the new text whenever the user types. */
        onInput?: (text: string) => void;
        /** Called with the current text when Enter is pressed without Shift. */
        onSubmit?: (s: string) => void;
        /** Called when Escape is pressed. */
        onCancel?: () => void;
        disabled?: boolean;
        placeholder?: string | null;
        color?: Color;
        autosize?: boolean;
    } = $props();

    function onKeyDown(event: KeyboardEvent) {
        // Enter pressed to commit an IME composition must not submit.
        if (event.isComposing) return;

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit(value);
        } else if (event.key === "Escape") {
            onCancel();
        }
    }
</script>

<textarea
    bind:value
    bind:this={element}
    class="font-sans textarea {color
        ? colorClass[color]
        : ''} flex-1 min-w-0 min-h-[1em] max-h-[40vh] {autosize
        ? 'field-sizing-content'
        : ''} resize-none outline-none overflow-y-auto contain-layout wrap-anywhere line-clamp-none"
    oninput={(event) => onInput(event.currentTarget.value)}
    spellcheck="false"
    {placeholder}
    onkeydown={onKeyDown}
    {disabled}
></textarea>
