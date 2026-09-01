<script module>
    import { uiState } from "@/lib/stores/ui.svelte";
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import { Logger } from "@common/logger/Logger";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import { createContext } from "svelte";

    // Tab Icons
    import UserIcon from "phosphor-svelte/lib/UserIcon";
    import ChatCircleTextIcon from "phosphor-svelte/lib/ChatCircleTextIcon";
    import BookOpenIcon from "phosphor-svelte/lib/BookOpenIcon";
    import ImageIcon from "phosphor-svelte/lib/ImageIcon";
    import FileTextIcon from "phosphor-svelte/lib/FileTextIcon";
    import MagicWandIcon from "phosphor-svelte/lib/MagicWandIcon";
    import GearIcon from "phosphor-svelte/lib/GearIcon";

    // Subpage components
    import CharacterBasicSettings from "./settingsSubpage/CharacterBasicSettings.svelte";
    import CharacterPromptSettings from "./settingsSubpage/CharacterPromptSettings.svelte";
    import CharacterLorebookSettings from "./settingsSubpage/CharacterLorebookSettings.svelte";
    import CharacterAssetsSettings from "./settingsSubpage/CharacterAssetsSettings.svelte";
    import CharacterMetadataSettings from "./settingsSubpage/CharacterMetadataSettings.svelte";
    import CharacterMagicSettings from "./settingsSubpage/CharacterMagicSettings.svelte";
    import CharacterHooksSettings from "./settingsSubpage/CharacterHooksSettings.svelte";

    import { declareTab } from "@/component/dialog/SettingsDialog.svelte";
    import SettingsDialog from "@/component/dialog/SettingsDialog.svelte";

    import type { TContext } from "./settingsSubpage/types.ts";

    const subpages = [
        declareTab(
            "basic",
            CharacterBasicSettings,
            UserIcon,
            "Basic Settings",
            "Basic Settings",
            "Basic"
        ),
        declareTab(
            "prompt",
            CharacterPromptSettings,
            ChatCircleTextIcon,
            "Prompt Settings",
            "Prompt Settings",
            "Prompt"
        ),
        declareTab(
            "lorebook",
            CharacterLorebookSettings,
            BookOpenIcon,
            "Lorebook Settings",
            "Lorebook Settings",
            "Lorebook"
        ),
        declareTab(
            "assets",
            CharacterAssetsSettings,
            ImageIcon,
            "Assets Settings",
            "Assets Settings",
            "Assets"
        ),
        declareTab(
            "metadata",
            CharacterMetadataSettings,
            FileTextIcon,
            "Metadata Settings",
            "Metadata Settings",
            "Metadata"
        ),
        declareTab(
            "magic",
            CharacterMagicSettings,
            MagicWandIcon,
            "Magic Patterns",
            "Magic Patterns",
            "Magic"
        ),
        declareTab(
            "advanced",
            CharacterHooksSettings,
            GearIcon,
            "Advanced Settings",
            "Advanced Settings",
            "Advanced"
        ),
    ];
</script>

<script lang="ts">
    /**
     * @component CharacterSettingsModal
     * Multi-tab modal for editing detailed character preferences.
     * Follows the SettingsModal pattern with autosave functionality.
     */

    let {
        selectCharacter,
        character,
        isOpened = false,
    }: {
        selectCharacter: (charId: string | null) => void;
        character: Character;
        isOpened?: boolean;
    } = $props();

    let activeTab = $state(subpages[0].kind ?? "");

    /** Local copy of character being edited (for autosave) */
    let editingCharacter: Character = $derived(character);

    let title = $derived.by(() => {
        if (editingCharacter) {
            return `${editingCharacter.name}`;
        }

        return "Character";
    });

    /** Debounce timer for autosave */
    let saveTimeout: ReturnType<typeof setTimeout> | null = null;

    function close() {
        uiState.closeCharacterSettings();

        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
        Logger.structured("modal.close", {
            location: "characterSettings",
            modalName: "CharacterSettingsModal",
        });
    }

    let dialog = $state<HTMLDialogElement>();

    $effect(() => {
        if (editingCharacter === null) close();
    });

    function onOpen() {
        isOpened = true;

        Logger.structured("modal.open", {
            location: "characterSettings",
            modalName: "CharacterSettingsModal",
            characterId: editingCharacter.id,
        });
    }

    function onClose() {
        isOpened = false;

        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }

        uiState.closeCharacterSettings();

        Logger.structured("modal.close", {
            location: "characterSettings",
            modalName: "CharacterSettingsModal",
        });
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

    function onTabChange(kind: string) {
        activeTab = kind;
        Logger.debug("Tab Changed: " + kind);
    }

    const [getContext, setContext] = createContext<TContext>();

    setContext({
        getCharacter: () => editingCharacter,
        /**
         * Handle character update from subpages.
         * Triggers autosave automatically.
         */
        onCharacterChange: (updatedCharacter: Character | null) => {
            if (updatedCharacter === null) {
                selectCharacter(null);
                close();
                return;
            }

            editingCharacter = updatedCharacter;

            triggerAutosave();
        },
    });

    const settingsModalContext = () => getContext();
</script>

<SettingsDialog
    id="character"
    bind:self={dialog}
    {title}
    {subpages}
    {onTabChange}
    {activeTab}
    {settingsModalContext}
    {isOpened}
    {onOpen}
    {onClose}
/>
