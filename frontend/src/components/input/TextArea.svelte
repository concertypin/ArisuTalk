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
    class="font-sans textarea {color ? `textarea-${color}` : ''} flex-1 min-h-[1em] {autosize
        ? 'field-sizing-content'
        : ''} resize-none outline-none overflow-hidden contain-layout text-optimize-speed break-all line-clamp-none"
    oninput={(event) => onInput(event.currentTarget.value)}
    spellcheck="false"
    {placeholder}
    onkeydown={onKeyDown}
    {disabled}
></textarea>
