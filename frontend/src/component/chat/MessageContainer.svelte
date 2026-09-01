<script lang="ts">
    import type { Snippet } from "svelte";
    import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
    import MessageBubble from "./MessageBubble.svelte";
    import { chatStore } from "@/features/chat/stores/chatStore.svelte";
    import { toastStore } from "@/lib/stores/toast.svelte";
    import { tick } from "svelte";
    import { Logger } from "@common/logger/Logger";
    import type { LocalChat } from "@/lib/interfaces";

    type Props = {
        children?: Snippet;
        messages: Message[];
        activeChat?: LocalChat;
    };

    let { messages, activeChat }: Props = $props();

    // Edit mode state
    let editingMessageId = $state<string | null>(null);

    let isTyping = $derived(chatStore.isGenerating);

    let container = $state<HTMLElement | null>(null);

    // Auto-scroll when messages change
    $effect(() => {
        if (messages.length) {
            void scrollToBottom().catch((err) => Logger.error("Scroll failed", err));
        }
    });

    async function scrollToBottom() {
        await tick();
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    async function onMessageUpdate(messageId: string, editingContent: string) {
        if (editingMessageId !== messageId) return;
        try {
            await chatStore.updateMessage(messageId, editingContent);
            editingMessageId = null;
        } catch (error) {
            toastStore.error(`Failed to update message: ${String(error)}`);
        }
    }

    async function onMessageDelete(messageId: string) {
        try {
            await chatStore.deleteMessage(messageId);
        } catch (error) {
            toastStore.error(`Failed to delete message: ${String(error)}`);
        }
    }

    async function onMessageRegenerate(messageId: string) {
        try {
            await chatStore.regenerateMessage(messageId);
        } catch (error) {
            toastStore.error(`Failed to regenerate message: ${String(error)}`);
        }
    }
</script>

<section class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={container}>
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
            <MessageBubble
                {message}
                {isEditing}
                bind:editingMessageId
                {onMessageUpdate}
                {onMessageDelete}
                {onMessageRegenerate}
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
