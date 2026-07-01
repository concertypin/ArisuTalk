<script lang="ts">
    import { chatStore } from "../stores/chatStore.svelte";
    import PlusIcon from "phosphor-svelte/lib/PlusIcon";
    import ChatTeardropTextIcon from "phosphor-svelte/lib/ChatTeardropTextIcon";
    import UsersIcon from "phosphor-svelte/lib/UsersIcon";
    import GlobeIcon from "phosphor-svelte/lib/GlobeIcon";
    import TrashIcon from "phosphor-svelte/lib/TrashIcon";
    import BranchViewer from "./BranchViewer.svelte";

    type Props = {
        characterId: string;
    };

    let { characterId }: Props = $props();

    let showBranchViewer = $state(false);
    let selectedChatId = $state<string | null>(null);

    // Direct chats for this character
    let directChats = $derived(
        chatStore.chats.filter(
            (c) => c.characterId === characterId && (!c.chatType || c.chatType === "direct")
        )
    );

    // Group/open chats that include this character
    let groupChats = $derived(
        chatStore.chats.filter(
            (c) =>
                c.characterId === characterId && (c.chatType === "group" || c.chatType === "open")
        )
    );

    let activeChatId = $derived(chatStore.activeChatId);

    // Automatically select the most recent chat when character changes
    $effect(() => {
        const characterChats = directChats;
        const currentActive = chatStore.activeChatId
            ? chatStore.chats.find((c) => c.id === chatStore.activeChatId)
            : null;

        if (!currentActive || currentActive.characterId !== characterId) {
            if (characterChats.length > 0) {
                const mostRecent = [...characterChats].sort(
                    (a, b) => (b.lastMessage || 0) - (a.lastMessage || 0)
                )[0];
                void chatStore.setActiveChat(mostRecent.id);
            } else if (groupChats.length > 0) {
                const mostRecent = [...groupChats].sort(
                    (a, b) => (b.lastMessage || 0) - (a.lastMessage || 0)
                )[0];
                void chatStore.setActiveChat(mostRecent.id);
            } else {
                void chatStore.setActiveChat(null);
            }
        }
    });

    async function handleNewChat() {
        const id = await chatStore.createChat(characterId, `Chat ${directChats.length + 1}`);
        void chatStore.setActiveChat(id);
    }

    async function handleNewGroupChat() {
        const id = await chatStore.createChat(
            characterId,
            `Group ${groupChats.length + 1}`,
            "group",
            []
        );
        void chatStore.setActiveChat(id);
    }

    function handleSelect(id: string) {
        void chatStore.setActiveChat(id);
    }

    async function handleDelete(e: Event, id: string) {
        e.stopPropagation();
        if (confirm("Delete this chat?")) {
            await chatStore.deleteChat(id);
        }
    }

    function handleShowBranchViewer(chatId: string) {
        selectedChatId = chatId;
        showBranchViewer = true;
    }

    function getParticipantCount(chat: (typeof directChats)[number]): number {
        if (chat.chatType === "group" && chat.participantIds) {
            return chat.participantIds.length + 1; // +1 for primary character
        }
        return 2; // direct chats: user + character
    }
</script>

<div class="flex flex-col w-64 h-full bg-base-200 border-r border-base-300 flex-none">
    <!-- Direct Chats Section Header -->
    <div class="p-4 border-b border-base-300 flex items-center justify-between">
        <h3 class="font-bold text-base-content/70 uppercase text-xs tracking-wider">
            Direct Chats
        </h3>
        <div class="flex gap-1">
            <button
                class="btn btn-ghost btn-xs btn-square"
                onclick={() => void handleNewChat()}
                aria-label="New Direct Chat"
            >
                <PlusIcon size={16} />
            </button>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-1 menu menu-sm w-full">
        {#each directChats as chat (chat.id)}
            <button
                class="w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors group {activeChatId ===
                chat.id
                    ? 'menu-active'
                    : ''}"
                onclick={() => handleSelect(chat.id)}
            >
                <ChatTeardropTextIcon size={16} class="opacity-70 shrink-0" />
                <span class="truncate text-sm font-medium flex-1 text-left">{chat.name}</span>

                <div
                    class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                    <div
                        role="button"
                        tabindex="0"
                        class="p-1 hover:text-info rounded"
                        onclick={(e) => {
                            e.stopPropagation();
                            handleShowBranchViewer(chat.id);
                        }}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                handleShowBranchViewer(chat.id);
                            }
                        }}
                        aria-label="Branch Viewer"
                    >
                        <span class="text-xs font-mono opacity-60">...</span>
                    </div>
                    <div
                        role="button"
                        tabindex="0"
                        class="p-1 hover:text-error rounded"
                        onclick={(e) => void handleDelete(e, chat.id)}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                void handleDelete(e, chat.id);
                            }
                        }}
                        aria-label="Delete"
                    >
                        <TrashIcon size={14} />
                    </div>
                </div>
            </button>
        {:else}
            <div class="text-center p-4 opacity-70 text-sm">No direct chats yet.</div>
        {/each}

        <!-- Group/Open Chats Section -->
        {#if groupChats.length > 0}
            <div class="divider my-1 text-xs opacity-50 uppercase tracking-wider">Group / Open</div>
            {#each groupChats as chat (chat.id)}
                <button
                    class="w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors group {activeChatId ===
                    chat.id
                        ? 'menu-active'
                        : ''}"
                    onclick={() => handleSelect(chat.id)}
                >
                    {#if chat.chatType === "group"}
                        <UsersIcon size={16} class="opacity-70 shrink-0 text-info" />
                    {:else}
                        <GlobeIcon size={16} class="opacity-70 shrink-0 text-success" />
                    {/if}
                    <span class="truncate text-sm font-medium flex-1 text-left">{chat.name}</span>

                    <!-- Participant count badge for group chats -->
                    {#if chat.chatType === "group"}
                        <span class="badge badge-xs badge-ghost opacity-60 shrink-0">
                            {getParticipantCount(chat)}
                        </span>
                    {/if}

                    <div
                        class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                    >
                        <div
                            role="button"
                            tabindex="0"
                            class="p-1 hover:text-info rounded"
                            onclick={(e) => {
                                e.stopPropagation();
                                handleShowBranchViewer(chat.id);
                            }}
                            onkeydown={(e) => {
                                if (e.key === "Enter") {
                                    handleShowBranchViewer(chat.id);
                                }
                            }}
                            aria-label="Branch Viewer"
                        >
                            <span class="text-xs font-mono opacity-60">...</span>
                        </div>
                        <div
                            role="button"
                            tabindex="0"
                            class="p-1 hover:text-error rounded"
                            onclick={(e) => void handleDelete(e, chat.id)}
                            onkeydown={(e) => {
                                if (e.key === "Enter") {
                                    void handleDelete(e, chat.id);
                                }
                            }}
                            aria-label="Delete"
                        >
                            <TrashIcon size={14} />
                        </div>
                    </div>
                </button>
            {/each}
        {/if}

        {#if directChats.length === 0 && groupChats.length === 0}
            <div class="text-center p-4 opacity-70 text-sm">
                No chats yet.
                <button class="link link-info" onclick={() => void handleNewChat()}>
                    Create a direct chat
                </button>
                <span class="opacity-50 ml-1">or</span>
                <button class="link link-secondary" onclick={() => void handleNewGroupChat()}>
                    start a group chat
                </button>
            </div>
        {/if}
    </div>

    <!-- Branch Viewer Modal -->
    {#if showBranchViewer && selectedChatId}
        <dialog class="modal modal-open" onclick={() => (showBranchViewer = false)}>
            <div
                class="modal-box"
                role="presentation"
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => e.stopPropagation()}
            >
                <form method="dialog">
                    <button
                        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onclick={() => (showBranchViewer = false)}>✕</button
                    >
                </form>
                <h3 class="font-bold text-lg mb-4">Branch Viewer</h3>
                <BranchViewer chatId={selectedChatId} onClose={() => (showBranchViewer = false)} />
            </div>
            <form method="dialog" class="modal-backdrop">
                <button onclick={() => (showBranchViewer = false)}>close</button>
            </form>
        </dialog>
    {/if}
</div>
