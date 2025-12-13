<script lang="ts">
    import { chatStore } from "../stores/chatStore.svelte";
    import { Plus, MessageSquare, Trash2 } from "@lucide/svelte";

    interface Props {
        characterId: string;
    }

    let { characterId }: Props = $props();

    let chats = $derived(chatStore.chats.filter((c) => c.characterId === characterId));
    let activeChatId = $derived(chatStore.activeChatId);

    function handleNewChat() {
        const id = chatStore.createChat(characterId, `Chat ${chats.length + 1}`);
        chatStore.setActiveChat(id);
    }

    function handleSelect(id: string) {
        chatStore.setActiveChat(id);
    }

    function handleDelete(e: Event, id: string) {
        e.stopPropagation();
        if (confirm("Delete this chat?")) {
            chatStore.deleteChat(id);
        }
    }
</script>

<div class="flex flex-col w-64 h-full bg-base-200 border-r border-base-300 flex-none">
    <div class="p-4 border-b border-base-300 flex items-center justify-between">
        <h3 class="font-bold text-base-content/70 uppercase text-xs tracking-wider">Chats</h3>
        <button
            class="btn btn-ghost btn-xs btn-square"
            onclick={handleNewChat}
            aria-label="New Chat"
        >
            <Plus size={16} />
        </button>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-1 menu menu-sm w-full">
        {#each chats as chat (chat.id)}
            <button
                class="w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors group {activeChatId ===
                chat.id
                    ? 'menu-active'
                    : ''}"
                onclick={() => handleSelect(chat.id)}
            >
                <MessageSquare size={16} class="opacity-70" />
                <span class="truncate text-sm font-medium flex-1 text-left">{chat.name}</span>

                <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                        role="button"
                        tabindex="0"
                        class="p-1 hover:text-error rounded"
                        onclick={(e) => handleDelete(e, chat.id)}
                        onkeydown={(e) => e.key === "Enter" && handleDelete(e, chat.id)}
                    >
                        <Trash2 size={14} />
                    </div>
                </div>
            </button>
        {/each}

        {#if chats.length === 0}
            <div class="text-center p-4 opacity-70 text-sm">
                No chats yet.
                <button class="link link-info" onclick={handleNewChat}>Create one?</button>
            </div>
        {/if}
    </div>
</div>
