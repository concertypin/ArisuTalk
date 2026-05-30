import { describe, it, expect, beforeEach } from "vitest";
import { uiState } from "@/lib/stores/ui.svelte";

describe("UI Store", () => {
    beforeEach(() => {
        // Reset state
        uiState.closeSettingsModal();
    });

    it("should initialize with settings modal closed", () => {
        expect(uiState.settingsModalOpen).toBe(false);
    });

    it("should open settings modal", () => {
        uiState.openSettingsModal();
        expect(uiState.settingsModalOpen).toBe(true);
    });

    it("should close settings modal", () => {
        uiState.openSettingsModal();
        uiState.closeSettingsModal();
        expect(uiState.settingsModalOpen).toBe(false);
    });

    it("should toggle settings modal", () => {
        expect(uiState.settingsModalOpen).toBe(false);
        uiState.toggleSettingsModal();
        expect(uiState.settingsModalOpen).toBe(true);
        uiState.toggleSettingsModal();
        expect(uiState.settingsModalOpen).toBe(false);
    });

    it("should open and close character settings for a character", () => {
        const character = { id: "char-1", name: "Test" } as any;
        expect(uiState.characterSettingsOpen).toBe(false);
        expect(uiState.characterSettingsTarget).toBeNull();

        uiState.openCharacterSettings(character);
        expect(uiState.characterSettingsOpen).toBe(true);
        expect(uiState.characterSettingsTarget).toBe(character);

        uiState.closeCharacterSettings();
        expect(uiState.characterSettingsOpen).toBe(false);
        expect(uiState.characterSettingsTarget).toBeNull();
    });
});
