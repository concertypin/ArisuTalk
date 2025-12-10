<!--
  @component Sidebar
  Character list sidebar with toggle functionality.
-->
<script lang="ts">
    import { uiState } from "@/lib/stores/ui.svelte";

    interface Props {
        collapsed?: boolean;
        onToggle?: () => void;
    }

    let { collapsed = false, onToggle }: Props = $props();

    // Mock chats
    const chats = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
    ];
</script>

<aside
    class="flex flex-col h-full bg-gray-900 border-r border-gray-700 transition-all duration-300 {collapsed
        ? 'w-0'
        : 'w-80'} relative"
>
    <!-- Toggle Button -->
    <button
        class="absolute top-1/2 -right-4 z-20 flex items-center justify-center w-8 h-8 bg-gray-800 border border-gray-600 rounded-full hover:bg-gray-600 transition-colors"
        onclick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
        <span class="text-xs">{collapsed ? "▶" : "◀"}</span>
    </button>

    <div
        class="flex flex-col h-full overflow-hidden transition-opacity duration-300 {collapsed
            ? 'opacity-0 pointer-events-none'
            : 'opacity-100'}"
    >
        <header class="p-4 border-b border-gray-700">
            <h1 class="text-lg font-semibold">ArisuTalk</h1>
        </header>

        <nav class="flex-1 overflow-y-auto p-4 space-y-2">
            {#each chats as chat (chat.id)}
                <button
                    class="w-full text-left p-3 rounded hover:bg-gray-800 transition-colors block"
                >
                    {chat.name}
                </button>
            {/each}
        </nav>

        <div class="p-4 border-t border-gray-700">
            <button
                class="w-full p-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                onclick={() => uiState.openSettingsModal()}
            >
                <span>⚙️ Settings</span>
            </button>
        </div>
    </div>
</aside>
