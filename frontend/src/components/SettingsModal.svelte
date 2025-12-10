<!--
  @component SettingsModal
  Modal for application settings.
-->
<script lang="ts">
    import { uiState } from "@/lib/stores/ui.svelte";
    import Button from "@/components/ui/Button.svelte";

    // Prevent closing when clicking content
    function handleContentClick(e: MouseEvent) {
        e.stopPropagation();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            uiState.closeSettingsModal();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    onclick={() => uiState.closeSettingsModal()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <!-- Modal Content -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
        class="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
        onclick={handleContentClick}
        role="document"
    >
        <header class="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 class="text-lg font-semibold">Settings</h2>
            <button
                class="text-gray-400 hover:text-white"
                onclick={() => uiState.closeSettingsModal()}
            >
                ✕
            </button>
        </header>

        <div class="p-6 space-y-4">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-300 mb-1"
                    >Username</label
                >
                <input
                    id="username"
                    type="text"
                    class="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Enter your name"
                />
            </div>
            <div>
                <label for="theme" class="block text-sm font-medium text-gray-300 mb-1">Theme</label
                >
                <select
                    id="theme"
                    class="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-indigo-500"
                >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="system">System</option>
                </select>
            </div>
        </div>

        <footer class="p-4 border-t border-gray-800 bg-gray-800/50 flex justify-end">
            <Button onclick={() => uiState.closeSettingsModal()}>Save</Button>
        </footer>
    </div>
</div>
