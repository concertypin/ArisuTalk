<!--
  @component MessageInput
  Message composer with a send button and an emoji picker.
-->
<script lang="ts">
    import TextArea from "@/components/input/TextArea.svelte";
    import SmileyIcon from "phosphor-svelte/lib/SmileyIcon";
    import StickerPicker from "@/features/sticker/components/StickerPicker.svelte";

    type Props = {
        /** Called with the message text when the user sends a non-empty message. */
        onSubmit: (s: string) => void | Promise<void>;
        /** Disables the whole composer. */
        disabled?: boolean;
        /** While true, typing stays enabled but sending is blocked. */
        isGenerating?: boolean;
    };
    let { onSubmit, disabled = false, isGenerating = false }: Props = $props();

    let inputValue = $state("");
    let showEmojiPicker = $state(false);
    let textArea = $state<HTMLTextAreaElement | null>(null);

    let canSend = $derived(!disabled && !isGenerating && inputValue.trim() !== "");

    /** Sends the draft and clears the input. */
    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        if (!canSend) return;

        const text = inputValue;
        inputValue = "";
        void onSubmit(text);
    }

    /** Inserts the emoji at the cursor (or replaces the selection) of the text area. */
    function handleEmojiSelect(emoji: string): void {
        const start = textArea?.selectionStart ?? inputValue.length;
        const end = textArea?.selectionEnd ?? inputValue.length;

        inputValue = inputValue.slice(0, start) + emoji + inputValue.slice(end);
        closeEmojiPicker();

        const caret = start + emoji.length;
        requestAnimationFrame(() => {
            textArea?.focus();
            textArea?.setSelectionRange(caret, caret);
        });
    }

    function openEmojiPicker() {
        showEmojiPicker = true;
    }

    function closeEmojiPicker() {
        showEmojiPicker = false;
    }
</script>

<footer class="p-4 border-t border-base-300/50 bg-base-200/80">
    <form class="flex gap-2" onsubmit={handleSubmit}>
        <TextArea
            bind:value={inputValue}
            bind:element={textArea}
            placeholder="Type a message..."
            enterkeyhint="send"
            {disabled}
        />
        <button
            type="button"
            class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
            onclick={openEmojiPicker}
            {disabled}
            aria-label="Pick emoji"
            title="Emoji"
        >
            <SmileyIcon size={20} />
        </button>
        <button
            type="submit"
            class="btn btn-primary shadow-md hover:shadow-lg transition-shadow"
            disabled={!canSend}>Send</button
        >
    </form>

    {#if showEmojiPicker}
        <StickerPicker onSelect={handleEmojiSelect} onClose={closeEmojiPicker} />
    {/if}
</footer>
