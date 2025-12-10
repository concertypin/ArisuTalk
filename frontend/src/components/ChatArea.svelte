<!--
  @component ChatArea
  Main chat content area.
-->
<script lang="ts">
    import { tick } from "svelte";
    import Button from "@/components/ui/Button.svelte";

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
    let pendingTimeoutIds: Set<number> = new Set();

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

<main class="flex flex-col flex-1 h-full bg-gray-950">
    <header class="flex items-center p-4 border-b border-gray-800 bg-gray-900">
        <h2 class="text-lg font-medium">Chat</h2>
    </header>

    <section class="flex-1 overflow-y-auto p-6 space-y-4" bind:this={messagesContainer}>
        {#if messages.length === 0}
            <div class="flex items-center justify-center h-full text-gray-500">
                <p>No messages yet. Say hello!</p>
            </div>
        {/if}

        {#each messages as msg (msg.id)}
            <div class="flex {msg.sender === 'user' ? 'justify-end' : 'justify-start'}">
                <div
                    class="max-w-[70%] p-3 rounded-lg {msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-200'}"
                >
                    <p>{msg.text}</p>
                    <span class="text-xs opacity-70 mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                </div>
            </div>
        {/each}

        {#if isTyping}
            <div class="flex justify-start">
                <div class="bg-gray-800 p-3 rounded-lg text-gray-400 text-sm">Typing...</div>
            </div>
        {/if}
    </section>

    <footer class="p-4 border-t border-gray-800 bg-gray-900">
        <div class="flex gap-2">
            <input
                type="text"
                class="flex-1 p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Type a message..."
                bind:value={inputValue}
                onkeydown={handleKeydown}
            />
            <Button onclick={sendMessage} disabled={!inputValue.trim()}>Send</Button>
        </div>
    </footer>
</main>
