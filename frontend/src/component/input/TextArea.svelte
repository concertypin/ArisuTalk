<script lang="ts">
    type Props = {
        value: string;
        onKeyDown: (e: KeyboardEvent) => void;
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
        onKeyDown,
        disabled,
        placeholder,
        color,
        autosize = true,
    }: Props = $props();
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
