/**
 * @fileoverview Global UI state using Svelte 5 Runes.
 */

class UIState {
    settingsModalOpen = $state(false);

    toggleSettingsModal() {
        this.settingsModalOpen = !this.settingsModalOpen;
    }

    openSettingsModal() {
        this.settingsModalOpen = true;
    }

    closeSettingsModal() {
        this.settingsModalOpen = false;
    }
}

export const uiState = new UIState();
