<script module>
    import type { FormEventHandler } from "svelte/elements";
</script>

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
        onInput = () => undefined,
        onSubmit = (_: any) => undefined,
        onCancel = () => undefined,
        disabled = false,
        placeholder,
        color,
        autosize = true,
    }: {
        value?: string;
        onInput?: (text: string) => void;
        onSubmit?: (s: string) => void;
        onCancel?: () => void;
        disabled?: boolean;
        placeholder?: string | null;
        color?: Color;
        autosize?: boolean;
    } = $props();

    let isShiftPressing = false;

    function onKeyUp(event: KeyboardEvent) {
        if (event.key === "Shift") {
            isShiftPressing = false;
        }
    }

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Shift") {
            isShiftPressing = true;
        } else if (event.key === "Enter" && !isShiftPressing) {
            event.preventDefault();
            const s = value;
            value = "";
            onSubmit(s);
        } else if (event.key === "Escape") {
            onCancel();
        }
    }

    function onBlur(_: any) {
        isShiftPressing = false;
    }

    const textareaOnInput: FormEventHandler<HTMLTextAreaElement> = (event) => {
        value = event.currentTarget.value;

        onInput(value);
    };
</script>

<textarea
    bind:value
    class="font-sans textarea {color ? 'textarea-' + color : ''} flex-1 min-h-[1em] {autosize
        ? 'field-sizing-content'
        : ''} resize-none outline-none overflow-hidden contain-layout text-optimize-speed break-all line-clamp-none"
    oninput={textareaOnInput}
    spellcheck="false"
    {placeholder}
    onkeyup={onKeyUp}
    onkeydown={onKeyDown}
    onblur={onBlur}
    {disabled}
>
</textarea>
