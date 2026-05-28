/**
 * @fileoverview Global UI state using Svelte 5 Runes.
 */

import type { Character } from "@arisutalk/character-spec/v0/Character";

class UIState {
    settingsModalOpen = $state(false);
    characterSettingsOpen = $state(false);
    characterSettingsTarget = $state<Character | null>(null);

    toggleSettingsModal() {
        this.settingsModalOpen = !this.settingsModalOpen;
    }

    openSettingsModal() {
        this.settingsModalOpen = true;
    }

    closeSettingsModal() {
        this.settingsModalOpen = false;
    }

    /**
     * Opens the character settings modal for the given character.
     * @param character - The character to edit
     */
    openCharacterSettings(character: Character) {
        this.characterSettingsTarget = character;
        this.characterSettingsOpen = true;
    }

    /**
     * Closes the character settings modal.
     */
    closeCharacterSettings() {
        this.characterSettingsOpen = false;
        this.characterSettingsTarget = null;
    }
}

export const uiState = new UIState();
