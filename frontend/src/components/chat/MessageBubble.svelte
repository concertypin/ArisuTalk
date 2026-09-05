<script module>
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import MessageActions from "./MessageActions.svelte";
    import TextArea from "@/components/input/TextArea.svelte";

    import { marked } from "marked";
    import DOMPurify from "dompurify";

    marked.setOptions({
        gfm: true,
        breaks: true,
    });
</script>

<script lang="ts">
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
        onSubmit(editingContent);
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

    function onSubmit(s: string) {
        onMessageUpdate(message.id, s);
        editingContent = "";
    }

    let html = $derived(marked.parse(getMessageText(message), { async: false }));
</script>

<div class="chat group {message.role === 'user' ? 'chat-end' : 'chat-start'}">
    <div class="chat-bubble shadow-lg max-w-[80ch]">
        {#if isEditing}
            <TextArea bind:value={editingContent} {onSubmit} />
        {:else}
            <div class="prose prose-compact prose-invert prose-sm prose-gray max-w-[80ch]">
                {@html DOMPurify.sanitize(html)}
            </div>
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
