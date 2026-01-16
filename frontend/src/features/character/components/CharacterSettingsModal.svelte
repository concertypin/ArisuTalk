<script lang="ts">
    /**
     * @component CharacterSettingsModal
     * Multi-tab modal for editing detailed character preferences.
     * Follows the SettingsModal pattern with autosave functionality.
     */
    import { uiState } from "@/lib/stores/ui.svelte";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import { Logger } from "@common/logger/Logger";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import {
        X,
        User,
        MessageSquare,
        BookOpen,
        FileText,
        Settings as SettingsIcon,
    } from "@lucide/svelte";

    // Subpage components
    import CharacterBasicSettings from "./settingsSubpage/CharacterBasicSettings.svelte";
    import CharacterPromptSettings from "./settingsSubpage/CharacterPromptSettings.svelte";
    import CharacterLorebookSettings from "./settingsSubpage/CharacterLorebookSettings.svelte";
    import CharacterMetadataSettings from "./settingsSubpage/CharacterMetadataSettings.svelte";
    import CharacterHooksSettings from "./settingsSubpage/CharacterHooksSettings.svelte";

    let dialog = $state<HTMLDialogElement>();
    type ActiveTab = "basic" | "prompt" | "lorebook" | "metadata" | "advanced";
    let activeTab = $state<ActiveTab>("basic");

    /** Local copy of character being edited (for autosave) */
    let editingCharacter = $state<Character | null>(null);

    /** Debounce timer for autosave */
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    // Effect to open modal when state is set AND dialog is bound
    $effect(() => {
        1;
        const dialogEl = dialog;
        if (!dialogEl) return;

        if (uiState.characterSettingsOpen && uiState.characterSettingsTarget && !dialogEl.open) {
            // Deep clone using JSON to avoid Svelte proxy issues
            editingCharacter = JSON.parse(
                JSON.stringify(uiState.characterSettingsTarget)
            ) as Character;
            activeTab = "basic";
            dialogEl.showModal();
            Logger.structured("modal.open", {
                location: "characterSettings",
                modalName: "CharacterSettingsModal",
                characterId: editingCharacter?.id,
            });
        }
    });

    function close() {
        dialog?.close();
        uiState.closeCharacterSettings();
        editingCharacter = null;
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        Logger.structured("modal.close", {
            location: "characterSettings",
            modalName: "CharacterSettingsModal",
        });
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === dialog) {
            close();
        }
    }

    /**
     * Autosave with debounce (300ms).
     * Called whenever editingCharacter changes.
     */
    function triggerAutosave() {
        if (!editingCharacter) return;

        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        saveTimeout = setTimeout(async () => {
            if (!editingCharacter) return;

            const index = characterStore.characters.findIndex((c) => c.id === editingCharacter!.id);
            if (index !== -1) {
                await characterStore.update(index, editingCharacter);
                Logger.structured("character.autosave", {
                    characterId: editingCharacter.id,
                });
            }
        }, 300);
    }

    /**
     * Handle character update from subpages.
     * Triggers autosave automatically.
     */
    function handleCharacterChange(updatedCharacter: Character) {
        editingCharacter = updatedCharacter;
        triggerAutosave();
    }
</script>

<dialog
    bind:this={dialog}
    class="modal"
    onclose={close}
    onclick={handleBackdropClick}
    aria-labelledby="character-settings-title"
>
    <div
        class="modal-box w-11/12 max-w-5xl h-[80vh] p-0 flex flex-col overflow-hidden bg-base-100 text-base-content shadow-2xl"
    >
        <!-- Header -->
        <header
            class="flex items-center justify-between p-4 border-b border-base-300/50 bg-base-200/80"
        >
            <h2
                id="character-settings-title"
                class="text-xl font-bold flex items-center gap-2 tracking-tight"
            >
                <SettingsIcon size={24} />
                {editingCharacter?.name || "Character"} Settings
            </h2>
            <button
                class="btn btn-ghost btn-sm btn-square hover:bg-base-300/50"
                onclick={close}
                aria-label="Close"
            >
                <X size={20} />
            </button>
        </header>

        <!-- Content -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar -->
            <aside class="w-56 bg-base-200/60 p-3 overflow-y-auto border-r border-base-300/50">
                <ul class="menu w-full p-0 gap-1">
                    <li>
                        <button
                            class="flex gap-2 rounded-lg"
                            class:active={activeTab === "basic"}
                            onclick={() => (activeTab = "basic")}
                            aria-label="Basic Settings"
                        >
                            <User size={18} /> Basic
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2 rounded-lg"
                            class:active={activeTab === "prompt"}
                            onclick={() => (activeTab = "prompt")}
                            aria-label="Prompt Settings"
                        >
                            <MessageSquare size={18} /> Prompt
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2 rounded-lg"
                            class:active={activeTab === "lorebook"}
                            onclick={() => (activeTab = "lorebook")}
                            aria-label="Lorebook Settings"
                        >
                            <BookOpen size={18} /> Lorebook
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2 rounded-lg"
                            class:active={activeTab === "metadata"}
                            onclick={() => (activeTab = "metadata")}
                            aria-label="Metadata Settings"
                        >
                            <FileText size={18} /> Metadata
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2 rounded-lg"
                            class:active={activeTab === "advanced"}
                            onclick={() => (activeTab = "advanced")}
                            aria-label="Advanced Settings"
                        >
                            <SettingsIcon size={18} /> Advanced
                        </button>
                    </li>
                </ul>
            </aside>

            <!-- Main Panel -->
            <main class="flex-1 p-6 overflow-y-auto bg-base-100">
                {#if editingCharacter}
                    {#if activeTab === "basic"}
                        <CharacterBasicSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {:else if activeTab === "prompt"}
                        <CharacterPromptSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {:else if activeTab === "lorebook"}
                        <CharacterLorebookSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {:else if activeTab === "metadata"}
                        <CharacterMetadataSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {:else if activeTab === "advanced"}
                        <CharacterHooksSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {/if}
                {/if}
            </main>
        </div>

        <!-- Footer -->
        <div class="modal-action p-4 border-t border-base-300/50 bg-base-200/60 m-0">
            <span class="text-sm text-base-content/50 flex-1">Changes are saved automatically</span>
            <button class="btn btn-primary shadow-md" onclick={close}>Close</button>
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button>close</button>
    </form>
</dialog>

<style>
    aside::-webkit-scrollbar {
        width: 4px;
    }
    aside::-webkit-scrollbar-thumb {
        background-color: var(--fallback-bc, oklch(var(--bc) / 0.2));
        border-radius: 4px;
    }
</style>
