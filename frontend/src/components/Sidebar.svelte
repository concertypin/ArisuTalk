<!--
  @component Sidebar
  Character list sidebar with toggle functionality.
-->
<script lang="ts">
    import { uiState } from "@/lib/stores/ui.svelte";
    import { Settings } from "@lucide/svelte";

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
    class="flex flex-col h-full bg-base-200 border-r border-base-300 transition-all duration-300 {collapsed
        ? 'w-0'
        : 'w-80'} relative"
>
    <!-- Toggle Button -->
    <button
        class="btn btn-circle btn-sm absolute top-1/2 -right-4 z-20 border border-base-300"
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
        <header class="p-4 border-b border-base-300">
            <h1 class="text-lg font-semibold">ArisuTalk</h1>
        </header>

        <nav class="flex-1 overflow-y-auto p-4 space-y-2">
            {#each chats as chat (chat.id)}
                <button class="btn btn-ghost justify-start w-full">
                    {chat.name}
                </button>
            {/each}
        </nav>

        <div class="p-4 border-t border-base-300">
            <button
                class="btn btn-ghost btn-sm w-full justify-start gap-2"
                onclick={() => uiState.openSettingsModal()}
            >
                <Settings class="w-4 h-4" /><span>Settings</span>
            </button>
        </div>
    </div>
</aside>
