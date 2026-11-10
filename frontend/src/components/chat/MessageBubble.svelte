<script lang="ts" module>
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import MessageActions from "./MessageActions.svelte";
    import TextArea from "@/components/input/TextArea.svelte";
    import SanitizedHtml from "@/components/SanitizedHtml.svelte";

    import { marked } from "marked";

    marked.setOptions({
        gfm: true,
        breaks: true,
    });
</script>

<script lang="ts">
    type Props = {
        message: Message;
        isEditing: boolean;
        onEditStart: (id: string) => void;
        onEditCancel: () => void;
        onMessageUpdate: (id: string, content: string) => void;
        onMessageDelete: (id: string) => void;
        onMessageRegenerate: (id: string) => void;
    };

    let {
        message,
        isEditing,
        onEditStart,
        onEditCancel,
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
        onEditStart(message.id);
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
        onEditCancel();
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
            <TextArea bind:value={editingContent} {onSubmit} onCancel={onCancelEdit} />
        {:else}
            <SanitizedHtml
                class="prose prose-compact prose-invert prose-sm prose-gray max-w-[80ch]"
                {html}
            />
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
