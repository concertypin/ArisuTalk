<script lang="ts" module>
    import TextArea from "@/components/input/TextArea.svelte";
    import SmileyIcon from "phosphor-svelte/lib/SmileyIcon";
    import StickerPicker from "@/features/sticker/components/StickerPicker.svelte";
</script>

<!--
  @component MessageInput
  Message composer with a send button and an emoji picker.
-->
<script lang="ts">
    let {
        onSubmit,
        disabled = false,
        isGenerating = false,
    }: {
        /** Called with the message text when the user sends a non-empty message. */
        onSubmit: (s: string) => void;
        /** Disables the whole composer. */
        disabled?: boolean;
        /** While true, typing stays enabled but sending is blocked. */
        isGenerating?: boolean;
    } = $props();

    let inputValue = $state("");
    let showEmojiPicker = $state(false);
    let textArea = $state<HTMLTextAreaElement | null>(null);

    let canSend = $derived(!disabled && !isGenerating && inputValue.trim() !== "");

    /** Sends the message and clears the input. Shared by the Enter key and the Send button. */
    function send(text: string) {
        if (disabled || isGenerating || !text.trim()) return;

        inputValue = "";
        onSubmit(text);
    }

    /** Inserts the emoji at the cursor (or replaces the selection) of the text area. */
    function onSelect(emoji: string): void {
        const start = textArea?.selectionStart ?? inputValue.length;
        const end = textArea?.selectionEnd ?? inputValue.length;

        inputValue = inputValue.slice(0, start) + emoji + inputValue.slice(end);
        showEmojiPicker = false;

        const caret = start + emoji.length;
        requestAnimationFrame(() => {
            textArea?.focus();
            textArea?.setSelectionRange(caret, caret);
        });
    }

    function onClose() {
        showEmojiPicker = false;
    }
</script>

<footer class="p-4 border-t border-base-300/50 bg-base-200/80">
    <div class="flex gap-2">
        <TextArea
            bind:value={inputValue}
            bind:element={textArea}
            placeholder="Type a message..."
            onSubmit={send}
            {disabled}
            color={null}
        />
        <button
            class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
            onclick={() => (showEmojiPicker = true)}
            {disabled}
            aria-label="Pick emoji"
            title="Emoji"
        >
            <SmileyIcon size={20} />
        </button>
        <button
            class="btn btn-primary shadow-md hover:shadow-lg transition-shadow"
            onclick={() => send(inputValue)}
            disabled={!canSend}>Send</button
        >
    </div>

    {#if showEmojiPicker}
        <StickerPicker {onSelect} {onClose} />
    {/if}
</footer>
