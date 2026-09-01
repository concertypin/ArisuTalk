<script lang="ts">
    import TextArea from "@/component/input/TextArea.svelte";
    import StickerIcon from "phosphor-svelte/lib/StickerIcon";
    import StickerPicker from "@/features/sticker/components/StickerPicker.svelte";
    import type { AssetEntity } from "@arisutalk/character-spec/v0/Character";

    type Props = {
        onSubmit: (s: string) => void;
        disabled?: boolean;
    };

    let { onSubmit, disabled = false }: Props = $props();

    let inputValue = $state("");
    let showStickerPicker = $state(false);

    function onClick(_: any) {
        onSend();
    }

    function onSend() {
        const s = inputValue;
        inputValue = "";
        onSubmit(s);
    }

    function onSelect(sticker: AssetEntity): void {
        if (sticker.mimeType === "text/plain") {
            inputValue += sticker.data;
        }

        showStickerPicker = false;
    }

    function onClose() {
        showStickerPicker = false;
    }
</script>

<footer class="p-4 border-t border-base-300/50 bg-base-200/80">
    <div class="flex gap-2">
        <TextArea
            bind:value={inputValue}
            placeholder="Type a message..."
            onSubmit={onSend}
            {disabled}
            color={null}
        />
        <button
            class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
            onclick={() => (showStickerPicker = true)}
            {disabled}
            aria-label="Pick sticker or emoji"
            title="Stickers & Emoji"
        >
            <StickerIcon size={20} />
        </button>
        <button
            class="btn btn-primary shadow-md hover:shadow-lg transition-shadow"
            onclick={onClick}
            disabled={!inputValue.trim() || disabled}>Send</button
        >
    </div>

    {#if showStickerPicker}
        <StickerPicker {onSelect} {onClose} />
    {/if}
</footer>
