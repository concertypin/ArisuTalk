<script lang="ts">
    import type { HTMLTextareaAttributes } from "svelte/elements";
    import TextArea from "@/components/input/TextArea.svelte";

    type Props = {
        /** Called with the text when the form is submitted. */
        onSubmit: (text: string) => void;
        onCancel?: () => void;
        enterkeyhint?: HTMLTextareaAttributes["enterkeyhint"];
    };

    let { onSubmit, onCancel, enterkeyhint }: Props = $props();

    let text = $state("");
</script>

<form
    onsubmit={(event) => {
        event.preventDefault();
        onSubmit(text);
    }}
>
    <TextArea bind:value={text} {onCancel} {enterkeyhint} />
</form>
