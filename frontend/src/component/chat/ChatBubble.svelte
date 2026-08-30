<script lang="ts">
    import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import MessageActions from "@/components/MessageActions.svelte";
    import TextArea from "@/component/input/TextArea.svelte";

    type Props = {
        message: Message;
        isEditing: boolean;
        editContent: string;
        onKeyDown: (e: KeyboardEvent) => void;
        onEdit: () => void;
        onDelete: () => void;
        onRegenerate: () => void;
        onConfirmEdit: () => void;
        onCancelEdit: () => void;
    };

    let {
        message,
        isEditing,
        editContent = $bindable(),
        onKeyDown,
        onEdit,
        onDelete,
        onRegenerate,
        onConfirmEdit,
        onCancelEdit,
    }: Props = $props();

    function getMessageText(msg: Message): string {
        return typeof msg.content.data === "string" ? msg.content.data : "";
    }
</script>

<div class="chat group {message.role === 'user' ? 'chat-end' : 'chat-start'}">
    <div class="chat-bubble shadow-lg max-w-[80ch]">
        {#if isEditing}
            <TextArea bind:value={editContent} {onKeyDown} />
        {:else}
            <MarkdownRenderer source={getMessageText(message)} />
        {/if}
        <div class="flex items-center justify-between mt-1">
            <span class="text-xs opacity-60">
                {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
            </span>
            <MessageActions
                {message}
                {isEditing}
                {onEdit}
                {onDelete}
                {onRegenerate}
                {onConfirmEdit}
                {onCancelEdit}
            />
        </div>
    </div>
</div>
