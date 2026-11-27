<script lang="ts" module>
    // Tab Icons
    import UserIcon from "phosphor-svelte/lib/UserIcon";
    import ChatCircleTextIcon from "phosphor-svelte/lib/ChatCircleTextIcon";
    import BookOpenIcon from "phosphor-svelte/lib/BookOpenIcon";
    import ImageIcon from "phosphor-svelte/lib/ImageIcon";
    import FileTextIcon from "phosphor-svelte/lib/FileTextIcon";
    import MagicWandIcon from "phosphor-svelte/lib/MagicWandIcon";
    import GearIcon from "phosphor-svelte/lib/GearIcon";

    // Subpage components
    import CharacterBasicSettings from "@/features/character/components/settingsSubpage/CharacterBasicSettings.svelte";
    import CharacterPromptSettings from "@/features/character/components/settingsSubpage/CharacterPromptSettings.svelte";
    import CharacterLorebookSettings from "@/features/character/components/settingsSubpage/CharacterLorebookSettings.svelte";
    import CharacterAssetsSettings from "@/features/character/components/settingsSubpage/CharacterAssetsSettings.svelte";
    import CharacterMetadataSettings from "@/features/character/components/settingsSubpage/CharacterMetadataSettings.svelte";
    import CharacterMagicSettings from "@/features/character/components/settingsSubpage/CharacterMagicSettings.svelte";
    import CharacterHooksSettings from "@/features/character/components/settingsSubpage/CharacterHooksSettings.svelte";

    import { preload } from "@/components/dialog/settingsPreload";

    const preloaded = preload([
        {
            type: "component",
            component: CharacterBasicSettings,
            icon: UserIcon,
            label: "Basic",
        },
        {
            type: "component",
            component: CharacterPromptSettings,
            icon: ChatCircleTextIcon,
            label: "Prompt",
        },
        {
            type: "component",
            component: CharacterLorebookSettings,
            icon: BookOpenIcon,
            label: "Lorebook",
        },
        {
            type: "component",
            component: CharacterAssetsSettings,
            icon: ImageIcon,
            label: "Assets",
        },
        {
            type: "component",
            component: CharacterMetadataSettings,
            icon: FileTextIcon,
            label: "Metadata",
        },
        {
            type: "component",
            component: CharacterMagicSettings,
            icon: MagicWandIcon,
            label: "Magic",
        },
        {
            type: "component",
            component: CharacterHooksSettings,
            icon: GearIcon,
            label: "Advanced",
        },
    ]);
</script>

<script lang="ts">
    import { characterStore } from "@/features/character/stores/characterStore.svelte";
    import { Logger } from "@common/logger/Logger";
    import type { Character } from "@arisutalk/character-spec/v0/Character";
    import SettingsDialog from "@/components/dialog/SettingsDialog.svelte";
    import { getAppContext } from "@/context";

    /**
     * @component CharacterSettingsModal
     * Multi-tab modal for editing detailed character preferences.
     * Follows the SettingsModal pattern with autosave functionality.
     */

    let {
        selectCharacter,
        character,
    }: {
        selectCharacter: (charId: string | null) => void;
        character: Character;
    } = $props();

    let appContext = getAppContext();

    let activeId = $state(preloaded.tabList[0]?.id ?? "");

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

    function onOpen() {
        Logger.structured("modal.open", {
            location: "characterSettings",
            modalName: "CharacterSettingsModal",
            characterId: editingCharacter.id,
        });
    }

    /** Drops the pending autosave. */
    function cancelAutosave() {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
            saveTimeout = null;
        }
    }

    function onClose() {
        cancelAutosave();

        appContext.characterSettingsOpen = false;
        appContext.editingCharacter = null;

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
                    (c) => c.id === editingCharacter.id
                );
                if (index !== -1) {
                    // Extract ID before logging to avoid DataCloneError with Svelte proxies
                    const characterId = editingCharacter.id;
                    await characterStore.update(index, editingCharacter);
                    Logger.structured("character.autosave", {
                        characterId,
                    });
                }
            })().catch((err) => Logger.error("Character autosave failed", err));
        }, 300);
    }

    function onTabChange(kind: string) {
        activeId = kind;
    }

    let context = $state({
        getCharacter: () => editingCharacter,
        cancelAutosave,
        /**
         * Handle character update from subpages.
         * Triggers autosave automatically.
         */
        onCharacterChange: (updatedCharacter: Character | null) => {
            if (updatedCharacter === null) {
                selectCharacter(null);
                onClose();
                return;
            }

            editingCharacter = updatedCharacter;

            triggerAutosave();
        },
    });

    const settingsModalContext = () => context;
</script>

<SettingsDialog
    id="character"
    {title}
    {preloaded}
    {onTabChange}
    {activeId}
    {onOpen}
    {onClose}
    {settingsModalContext}
/>
