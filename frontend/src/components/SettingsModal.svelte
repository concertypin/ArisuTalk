<script lang="ts">
    import { uiState } from "@/lib/stores/ui.svelte";

    import { settings } from "@/lib/stores/settings.svelte";
    import {
        X,
        Settings as SettingsIcon,
        MessageSquare,
        Cpu,
        Info,
        SlidersVertical,
    } from "@lucide/svelte";

    // Subpage components
    import GeneralSettings from "./settingSubpage/GeneralSettings.svelte";
    import LLMSettings from "./settingSubpage/LLMSettings.svelte";
    import PromptSettings from "./settingSubpage/PromptSettings.svelte";
    import AdvancedSettings from "./settingSubpage/AdvancedSettings.svelte";
    import AboutPage from "./settingSubpage/AboutPage.svelte";

    let dialog: HTMLDialogElement;
    type ActiveTab = "general" | "llm" | "prompt" | "advanced" | "about";
    let activeTab = $state<ActiveTab>("general");

    $effect(() => {
        // App.svelte conditionally renders this component.
        // When it mounts, we show the modal immediately.
        dialog?.showModal();
    });

    function close() {
        dialog?.close();
        uiState.closeSettingsModal();
    }

    function handleBackdropClick(e: MouseEvent) {
        // If the click is on the dialog itself (the backdrop area in native dialogs), close it.
        if (e.target === dialog) {
            close();
        }
    }

    async function save() {
        await settings.save();
        close();
    }
</script>

<dialog
    bind:this={dialog}
    class="modal"
    onclose={close}
    onclick={handleBackdropClick}
    aria-labelledby="settings-title"
>
    <div
        class="modal-box w-11/12 max-w-5xl h-[80vh] p-0 flex flex-col overflow-hidden bg-base-100 text-base-content"
    >
        <!-- Header -->
        <header class="flex items-center justify-between p-4 border-b border-base-300 bg-base-200">
            <h2 id="settings-title" class="text-xl font-bold flex items-center gap-2">
                <SettingsIcon size={24} /> Settings
            </h2>
            <button class="btn btn-ghost btn-sm btn-square" onclick={close} aria-label="Close">
                <X size={20} />
            </button>
        </header>

        <!-- Content -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar -->
            <aside class="w-64 bg-base-200 p-2 overflow-y-auto border-r border-base-300">
                <ul class="menu w-full p-0 rounded-box">
                    <li>
                        <button
                            class="flex gap-2"
                            class:active={activeTab === "general"}
                            onclick={() => (activeTab = "general")}
                            aria-label="General Settings"
                        >
                            <SettingsIcon size={18} /> General
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2"
                            class:active={activeTab === "llm"}
                            onclick={() => (activeTab = "llm")}
                            aria-label="LLM Configuration"
                        >
                            <Cpu size={18} /> Models (LLM)
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2"
                            class:active={activeTab === "prompt"}
                            onclick={() => (activeTab = "prompt")}
                            aria-label="Prompt Settings"
                        >
                            <MessageSquare size={18} /> Prompts
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2"
                            class:active={activeTab === "advanced"}
                            onclick={() => (activeTab = "advanced")}
                            aria-label="Advanced Settings"
                        >
                            <SlidersVertical size={18} /> Advanced
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2"
                            class:active={activeTab === "about"}
                            onclick={() => (activeTab = "about")}
                            aria-label="About"
                        >
                            <Info size={18} /> About
                        </button>
                    </li>
                </ul>
            </aside>

            <!-- Main Panel -->
            <main class="flex-1 p-6 overflow-y-auto">
                {#if activeTab === "general"}
                    <GeneralSettings />
                {:else if activeTab === "llm"}
                    <LLMSettings />
                {:else if activeTab === "prompt"}
                    <PromptSettings />
                {:else if activeTab === "advanced"}
                    <AdvancedSettings />
                {:else if activeTab === "about"}
                    <AboutPage />
                {/if}
            </main>
        </div>

        <!-- Footer -->
        <div class="modal-action p-4 border-t border-base-300 bg-base-100 m-0">
            <button class="btn" onclick={close}>Cancel</button>
            <button class="btn btn-primary" onclick={save}>Save Changes</button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<style>
    /* Custom scrollbar for sidebar if needed */
    aside::-webkit-scrollbar {
        width: 4px;
    }
    aside::-webkit-scrollbar-thumb {
        background-color: var(--fallback-bc, oklch(var(--bc) / 0.2));
        border-radius: 4px;
    }
</style>
