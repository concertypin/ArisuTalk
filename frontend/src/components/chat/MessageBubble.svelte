<!--
  @component MessageBubble
  One chat message: its rendered Markdown, the time it was sent and the edit/delete/regenerate actions.
  While editing, the text is replaced by a form with a text area that saves on Enter.
-->
<script lang="ts">
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import MessageActions from "@/components/chat/MessageActions.svelte";
    import TextArea from "@/components/input/TextArea.svelte";
    import SanitizedHtml from "@/components/SanitizedHtml.svelte";
    import { parseChatMarkdown } from "@/lib/utils/markdown";

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

    let editingContent = $state("");
    /** True while a save is in flight, so a repeated Enter/click cannot submit twice. */
    let isSaving = false;

    let isAssistant = $derived(message.role === "assistant");
    let html = $derived(parseChatMarkdown(getMessageText(message)));

    /** The text of a message, or an empty string when the message is not text. */
    function getMessageText(msg: Message): string {
        return typeof msg.content.data === "string" ? msg.content.data : "";
    }

    function onEdit() {
        onEditStart(message.id);
        editingContent = getMessageText(message);
    }

    function onCancelEdit() {
        onEditCancel();
        editingContent = "";
    }

    /**
     * Saves the draft. The draft is cleared only when the parent reports success; on failure
     * the text stays in the box and editing stays open so the user can retry.
     */
    async function save() {
        if (isSaving) return;
        isSaving = true;
        try {
            if (await onMessageUpdate(message.id, editingContent)) editingContent = "";
        } finally {
            isSaving = false;
        }
    }

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        void save();
    }
</script>

<div class={["chat group", message.role === "user" ? "chat-end" : "chat-start"]}>
    <div class="chat-bubble shadow-lg max-w-[80ch]" data-testid="message-bubble">
        {#if isEditing}
            <form class="flex" onsubmit={handleSubmit}>
                <TextArea bind:value={editingContent} onCancel={onCancelEdit} enterkeyhint="done" />
            </form>
        {:else}
            <SanitizedHtml class="prose prose-sm max-w-[80ch]" {html} />
        {/if}
        <div class="flex items-center justify-between mt-1">
            <span class="text-xs opacity-60">
                {new Date(message.timestamp || Date.now()).toLocaleTimeString()}
            </span>
            <MessageActions
                {isEditing}
                {isAssistant}
                {onEdit}
                onDelete={() => onMessageDelete(message.id)}
                onRegenerate={() => onMessageRegenerate(message.id)}
                onConfirmEdit={save}
                {onCancelEdit}
            />
        </div>
    </div>
</div>
