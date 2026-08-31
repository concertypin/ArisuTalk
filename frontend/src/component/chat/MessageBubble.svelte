<script lang="ts">
    import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import MessageActions from "./MessageActions.svelte";
    import TextArea from "@/component/input/TextArea.svelte";

    type Props = {
        message: Message;
        isEditing: boolean;
        editingMessageId: string | null;
        onMessageUpdate: (id: string, content: string) => void;
        onMessageDelete: (id: string) => void;
        onMessageRegenerate: (id: string) => void;
    };

    let {
        message,
        isEditing,
        editingMessageId = $bindable(),
        onMessageUpdate,
        onMessageDelete,
        onMessageRegenerate,
    }: Props = $props();

    let isAssistant = $derived(message.role === "assistant");

    // Edit mode state
    let editingContent = $state("");

    /**
     * Extracts text content from a message safely.
     */
    function getMessageText(msg: Message): string {
        return typeof msg.content.data === "string" ? msg.content.data : "";
    }

    function onEdit() {
        editingMessageId = message.id;
        editingContent = getMessageText(message);
    }

    function onConfirmEdit() {
        onMessageUpdate(message.id, editingContent);
    }

    function onDelete() {
        onMessageDelete(message.id);
    }

    function onRegenerate() {
        onMessageRegenerate(message.id);
    }

    function onCancelEdit() {
        editingMessageId = null;
        editingContent = "";
    }
</script>

<div class="chat group {message.role === 'user' ? 'chat-end' : 'chat-start'}">
    <div class="chat-bubble shadow-lg max-w-[80ch]">
        {#if isEditing}
            <TextArea bind:value={editingContent} onSubmit={onConfirmEdit} />
        {:else}
            <MarkdownRenderer source={getMessageText(message)} />
        {/if}
        <div class="flex items-center justify-between mt-1">
            <span class="text-xs opacity-60">
                {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
            </span>
            <MessageActions
                {isEditing}
                {isAssistant}
                {onEdit}
                {onDelete}
                {onRegenerate}
                {onConfirmEdit}
                {onCancelEdit}
            />
        </div>
    </div>
</div>
