<!--
  @component ChatArea
  Main chat content area.
-->
<script lang="ts">
    import { tick } from "svelte";
    import { Logger } from "@common/logger/Logger";

    import { chatStore } from "@/features/chat/stores/chatStore.svelte";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import { uiState } from "@/lib/stores/ui.svelte";
    import { toastStore } from "@/lib/stores/toast.svelte";
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import GearIcon from "phosphor-svelte/lib/GearIcon";
    import StickerIcon from "phosphor-svelte/lib/StickerIcon";
    import StickerPicker from "@/features/sticker/components/StickerPicker.svelte";
    import type { AssetEntity } from "@arisutalk/character-spec/v0/Character";
    import ChatBubble from "@/component/chat/ChatBubble.svelte";
    import TextArea from "@/component/input/TextArea.svelte";

    let inputValue = $state("");
    let showStickerPicker = $state(false);
    let messagesContainer = $state<HTMLElement | null>(null);
    let isTyping = $derived(chatStore.isGenerating);

    let activeChat = $derived(chatStore.chats.find((c) => c.id === chatStore.activeChatId));
    let messages = $derived(chatStore.activeMessages);

    /** Get the current character for this chat */
    let currentCharacter = $derived(
        activeChat
            ? characterStore.characters.find((c) => c.id === activeChat.characterId)
            : undefined
    );

    // Edit mode state
    let editingMessageId = $state<string | null>(null);
    let editContent = $state("");

    // Auto-scroll when messages change
    $effect(() => {
        if (messages.length) {
            void scrollToBottom().catch((err) => Logger.error("Scroll failed", err));
        }
    });

    async function sendMessage() {
        if (!inputValue.trim() || !activeChat) return;

        const content = inputValue;
        inputValue = ""; // Clear input immediately for better UX

        await chatStore.sendMessage(content);
    }

    async function scrollToBottom() {
        await tick();
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendMessage();
        }
    }

    /**
     * Extracts text content from a message safely.
     */
    function getMessageText(msg: Message): string {
        return typeof msg.content.data === "string" ? msg.content.data : "";
    }

    function startEdit(messageId: string, content: string) {
        editingMessageId = messageId;
        editContent = content;
    }

    async function confirmEdit() {
        if (!editingMessageId) return;
        try {
            await chatStore.updateMessage(editingMessageId, editContent);
            editingMessageId = null;
            editContent = "";
        } catch (error) {
            toastStore.error(`Failed to update message: ${String(error)}`);
        }
    }

    function cancelEdit() {
        editingMessageId = null;
        editContent = "";
    }

    /**
     * Handles keydown in edit textarea.
     * Ctrl+Enter = submit, Esc = cancel.
     */
    function handleEditKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            void confirmEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
        }
    }

    async function handleDelete(messageId: string) {
        try {
            await chatStore.deleteMessage(messageId);
        } catch (error) {
            toastStore.error(`Failed to delete message: ${String(error)}`);
        }
    }

    async function handleRegenerate(messageId: string) {
        try {
            await chatStore.regenerateMessage(messageId);
        } catch (error) {
            toastStore.error(`Failed to regenerate message: ${String(error)}`);
        }
    }

    function handleStickerSelect(sticker: AssetEntity): void {
        if (sticker.mimeType === "text/plain") {
            inputValue += sticker.data;
        }

        showStickerPicker = false;
    }

    function openCharacterSettings() {
        if (currentCharacter) {
            uiState.openCharacterSettings(currentCharacter);
        }
    }
</script>

<main class="flex flex-col flex-1 h-full bg-base-100">
    <header
        class="flex items-center justify-between p-4 border-b border-base-300/50 bg-base-200/80"
    >
        <h2 class="text-lg font-medium tracking-tight">{activeChat?.name || "Chat"}</h2>
        {#if currentCharacter}
            <button
                class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
                onclick={openCharacterSettings}
                aria-label="Character Settings"
                title="Character Settings"
            >
                <GearIcon size={18} />
            </button>
        {/if}
    </header>

    <section class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={messagesContainer}>
        {#if !activeChat}
            <div class="flex items-center justify-center h-full text-base-content/50">
                <p>Select a chat or create a new one to start messaging.</p>
            </div>
        {:else if messages.length === 0}
            <div class="flex items-center justify-center h-full text-base-content/50">
                <p>No messages yet. Say hello!</p>
            </div>
        {:else}
            {#each messages as message (message.id)}
                {@const isEditing = editingMessageId === message.id}
                <ChatBubble
                    {message}
                    {isEditing}
                    bind:editContent
                    onKeyDown={handleEditKeydown}
                    onEdit={() => startEdit(message.id, getMessageText(message))}
                    onDelete={() => void handleDelete(message.id)}
                    onRegenerate={() => void handleRegenerate(message.id)}
                    onConfirmEdit={() => void confirmEdit()}
                    onCancelEdit={cancelEdit}
                />
            {/each}
        {/if}

        {#if isTyping}
            <div class="chat chat-start">
                <div
                    class="chat-bubble chat-bubble-neutral flex items-center justify-center min-w-12 min-h-10"
                >
                    <span class="loading loading-dots loading-sm"></span>
                </div>
            </div>
        {/if}
    </section>

    <footer class="p-4 border-t border-base-300/50 bg-base-200/80">
        <div class="flex gap-2">
            <TextArea
                bind:value={inputValue}
                placeholder="Type a message..."
                onKeyDown={handleKeydown}
                disabled={!activeChat}
                color={null}
            />
            <button
                class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
                onclick={() => (showStickerPicker = true)}
                disabled={!activeChat}
                aria-label="Pick sticker or emoji"
                title="Stickers & Emoji"
            >
                <StickerIcon size={20} />
            </button>
            <button
                class="btn btn-primary shadow-md hover:shadow-lg transition-shadow"
                onclick={() => void sendMessage()}
                disabled={!inputValue.trim() || !activeChat}>Send</button
            >
        </div>

        {#if showStickerPicker}
            <StickerPicker
                onSelect={(s: AssetEntity) => handleStickerSelect(s)}
                onClose={() => (showStickerPicker = false)}
            />
        {/if}
    </footer>
</main>
