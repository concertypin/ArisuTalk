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
    import X from "phosphor-svelte/lib/XIcon";
    import User from "phosphor-svelte/lib/UserIcon";
    import ChatCircleText from "phosphor-svelte/lib/ChatCircleTextIcon";
    import BookOpen from "phosphor-svelte/lib/BookOpenIcon";
    import FileText from "phosphor-svelte/lib/FileTextIcon";
    import Gear from "phosphor-svelte/lib/GearIcon";
    import MagicWand from "phosphor-svelte/lib/MagicWandIcon";
    import ImageIcon from "phosphor-svelte/lib/ImageIcon";

    // Subpage components
    import CharacterBasicSettings from "./settingsSubpage/CharacterBasicSettings.svelte";
    import CharacterPromptSettings from "./settingsSubpage/CharacterPromptSettings.svelte";
    import CharacterLorebookSettings from "./settingsSubpage/CharacterLorebookSettings.svelte";
    import CharacterAssetsSettings from "./settingsSubpage/CharacterAssetsSettings.svelte";
    import CharacterMetadataSettings from "./settingsSubpage/CharacterMetadataSettings.svelte";
    import CharacterHooksSettings from "./settingsSubpage/CharacterHooksSettings.svelte";
    import CharacterMagicSettings from "./settingsSubpage/CharacterMagicSettings.svelte";
    import { cloneDeep } from "lodash-es";

    let dialog = $state<HTMLDialogElement>();
    type ActiveTab = "basic" | "prompt" | "lorebook" | "assets" | "metadata" | "advanced" | "magic";
    let activeTab = $state<ActiveTab>("basic");

    /** Local copy of character being edited (for autosave) */
    let editingCharacter = $state<Character | null>(null);

    /** Debounce timer for autosave */
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    // Effect to open modal when state is set AND dialog is bound
    $effect(() => {
        const dialogEl = dialog;
        if (!dialogEl) return;

        if (uiState.characterSettingsOpen && uiState.characterSettingsTarget && !dialogEl.open) {
            // Deep clone using JSON to avoid Svelte proxy issues
            editingCharacter = cloneDeep(uiState.characterSettingsTarget);
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

        saveTimeout = setTimeout(() => {
            // IIFE to suppress eslint complaint about ()=>Promise in setTimeout
            void (async () => {
                if (!editingCharacter) return;

                const index = characterStore.characters.findIndex(
                    (c) => c.id === editingCharacter!.id
                );
                if (index !== -1) {
                    // Extract ID before logging to avoid DataCloneError with Svelte proxies
                    const characterId = editingCharacter.id;
                    await characterStore.update(index, editingCharacter);
                    Logger.structured("character.autosave", {
                        characterId,
                    });
                }
            })();
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
                <Gear size={24} />
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
                            <ChatCircleText size={18} /> Prompt
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
                            class:active={activeTab === "assets"}
                            onclick={() => (activeTab = "assets")}
                            aria-label="Assets Settings"
                        >
                            <ImageIcon size={18} /> Assets
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
                            class:active={activeTab === "magic"}
                            onclick={() => (activeTab = "magic")}
                            aria-label="Magic Patterns"
                        >
                            <MagicWand size={18} /> Magic
                        </button>
                    </li>
                    <li>
                        <button
                            class="flex gap-2 rounded-lg"
                            class:active={activeTab === "advanced"}
                            onclick={() => (activeTab = "advanced")}
                            aria-label="Advanced Settings"
                        >
                            <Gear size={18} /> Advanced
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
                    {:else if activeTab === "assets"}
                        <CharacterAssetsSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {:else if activeTab === "metadata"}
                        <CharacterMetadataSettings
                            character={editingCharacter}
                            onChange={handleCharacterChange}
                        />
                    {:else if activeTab === "magic"}
                        <CharacterMagicSettings character={editingCharacter} />
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
