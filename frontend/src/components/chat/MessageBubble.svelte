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
        /**
         * Saves the edited text. Resolves `true` once it is persisted (the parent then leaves
         * edit mode) and `false` if saving failed (the parent keeps editing so nothing is lost).
         */
        onMessageUpdate: (id: string, content: string) => Promise<boolean>;
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
        void onSubmit(editingContent);
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

    /** True while a save is in flight, so a repeated Enter/click cannot submit twice. */
    let isSaving = false;

    /**
     * Saves the draft. The draft is cleared only when the parent reports success; on failure
     * the text stays in the box and editing stays open so the user can retry.
     */
    async function onSubmit(s: string) {
        if (isSaving) return;
        isSaving = true;
        try {
            if (await onMessageUpdate(message.id, s)) editingContent = "";
        } finally {
            isSaving = false;
        }
    }

    let html = $derived(marked.parse(getMessageText(message), { async: false }));
</script>

<div class="chat group {message.role === 'user' ? 'chat-end' : 'chat-start'}">
    <div class="chat-bubble shadow-lg max-w-[80ch]">
        {#if isEditing}
            <TextArea bind:value={editingContent} {onSubmit} onCancel={onCancelEdit} />
        {:else}
            <SanitizedHtml class="prose prose-compact prose-sm max-w-[80ch]" {html} />
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
