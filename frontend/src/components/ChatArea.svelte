<!--
  @component ChatArea
  Main chat content area.
-->
<script lang="ts">
    import { tick } from "svelte";
    import { SvelteSet } from "svelte/reactivity";

    type Message = {
        id: string;
        text: string;
        sender: "user" | "bot";
        timestamp: number;
    };

    let messages = $state<Message[]>([]);
    let inputValue = $state("");
    let isTyping = $state(false);
    let messagesContainer = $state<HTMLElement | null>(null);
    let pendingTimeoutIds: SvelteSet<number> = new SvelteSet();

    // Cleanup pending timeouts on unmount
    $effect(() => {
        return () => {
            pendingTimeoutIds.forEach((id) => clearTimeout(id));
            pendingTimeoutIds.clear();
        };
    });

    async function sendMessage() {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            text: inputValue,
            sender: "user",
            timestamp: Date.now(),
        };

        messages = [...messages, userMsg];
        inputValue = "";

        scrollToBottom();

        isTyping = true;

        // Mock response delay
        const timeoutId = setTimeout(async () => {
            const botMsg: Message = {
                id: crypto.randomUUID(),
                text: "This is a mock response from the system.",
                sender: "bot",
                timestamp: Date.now(),
            };
            messages = [...messages, botMsg];
            isTyping = pendingTimeoutIds.size > 0;
            pendingTimeoutIds.delete(timeoutId);
            scrollToBottom();
        }, 1000);

        pendingTimeoutIds.add(timeoutId);
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
            sendMessage();
        }
    }
</script>

<main class="flex flex-col flex-1 h-full bg-base-100">
    <header class="flex items-center p-4 border-b border-base-300 bg-base-200">
        <h2 class="text-lg font-medium">Chat</h2>
    </header>

    <section class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={messagesContainer}>
        {#if messages.length === 0}
            <div class="flex items-center justify-center h-full text-base-content/50">
                <p>No messages yet. Say hello!</p>
            </div>
        {/if}

        {#each messages as msg (msg.id)}
            <div class="chat {msg.sender === 'user' ? 'chat-end' : 'chat-start'}">
                <div
                    class="chat-bubble {msg.sender === 'user'
                        ? 'chat-bubble-primary'
                        : 'chat-bubble-neutral'}"
                >
                    <p>{msg.text}</p>
                    <span class="text-xs opacity-70 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        {/each}

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
            />
            <button class="btn btn-primary" onclick={sendMessage} disabled={!inputValue.trim()}
                >Send</button
            >
        </div>
    </footer>
</main>
