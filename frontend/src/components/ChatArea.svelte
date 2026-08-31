<!--
  @component ChatArea
  Main chat content area.
-->
<script lang="ts">
    import { chatStore } from "@/features/chat/stores/chatStore.svelte";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import { uiState } from "@/lib/stores/ui.svelte";
    import GearIcon from "phosphor-svelte/lib/GearIcon";
    import MessageContainer from "@/component/chat/MessageContainer.svelte";
    import MessageInput from "@/component/chat/MessageInput.svelte";

    let activeChat = $derived(chatStore.chats.find((c) => c.id === chatStore.activeChatId));
    let messages = $derived(chatStore.activeMessages);

    /** Get the current character for this chat */
    let currentCharacter = $derived(
        activeChat
            ? characterStore.characters.find((c) => c.id === activeChat.characterId)
            : undefined
    );

    async function sendMessage(s: string) {
        if (!s.trim() || !activeChat) return;

        await chatStore.sendMessage(s);
    }

    function onSubmit(s: string) {
        void sendMessage(s);
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

    <MessageContainer {messages} {activeChat} />

    <MessageInput {onSubmit} disabled={!activeChat} />
</main>
