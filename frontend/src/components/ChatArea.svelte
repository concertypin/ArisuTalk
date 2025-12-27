<!--
  @component ChatArea
  Main chat content area.
-->
<script lang="ts">
    import { tick } from "svelte";

    import { chatStore } from "@/features/chat/stores/chatStore.svelte";
    import MarkdownRenderer from "@/components/MarkdownRenderer.svelte";

    let inputValue = $state("");
    let messagesContainer = $state<HTMLElement | null>(null);
    let isTyping = $derived(chatStore.isGenerating);

    let activeChat = $derived(chatStore.chats.find((c) => c.id === chatStore.activeChatId));
    let messages = $derived(chatStore.activeMessages);

    // Auto-scroll when messages change
    $effect(() => {
        if (messages.length) {
            void scrollToBottom().catch((err) => console.error("Scroll failed", err));
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
</script>

<main class="flex flex-col flex-1 h-full bg-base-100">
    <header class="flex items-center p-4 border-b border-base-300 bg-base-200">
        <h2 class="text-lg font-medium">{activeChat?.name || "Chat"}</h2>
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
            {#each messages as msg (msg.id)}
                <div class="chat {msg.role === 'user' ? 'chat-end' : 'chat-start'}">
                    <div
                        class="chat-bubble {msg.role === 'user'
                            ? 'chat-bubble-primary'
                            : 'chat-bubble-neutral'}"
                    >
                        <MarkdownRenderer
                            source={typeof msg.content.data === "string" ? msg.content.data : ""}
                        />
                        <span class="text-xs opacity-70 mt-1 block">
                            {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            {/each}
        {/if}

        {#if isTyping}
            <div class="chat chat-start">
                <div class="chat-bubble chat-bubble-neutral">
                    <span class="loading loading-dots loading-sm"></span>
                </div>
            </div>
        {/if}
    </section>

    <footer class="p-4 border-t border-base-300 bg-base-200">
        <div class="flex gap-2">
            <input
                type="text"
                class="input flex-1"
                placeholder="Type a message..."
                bind:value={inputValue}
                onkeydown={handleKeydown}
                disabled={!activeChat}
            />
            <button
                class="btn btn-primary"
                onclick={() => void sendMessage()}
                disabled={!inputValue.trim() || !activeChat}>Send</button
            >
        </div>
    </footer>
</main>
