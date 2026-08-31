<script lang="ts">
    type Props = {
        value: string;
        onSubmit?: (s: string) => void;
        onCancel?: () => void;
        disabled?: boolean;
        placeholder?: string | null;
        color?: Color;
        autosize?: boolean;
    };

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
        value = $bindable(),
        onSubmit = (_: any) => undefined,
        onCancel = () => undefined,
        disabled = false,
        placeholder,
        color,
        autosize = true,
    }: Props = $props();

    function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit(value);
        } else if (event.key === "Escape") {
            onCancel();
        }
    }
</script>

<textarea
    class="textarea {color ? 'textarea-' + color : ''} flex-1 min-h-[1em] {autosize
        ? 'field-sizing-content'
        : ''} resize-none"
    bind:value
    {placeholder}
    onkeydown={onKeyDown}
    {disabled}
>
</textarea>
