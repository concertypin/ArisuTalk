/// <reference types="vitest/browser" />

import { test, expect, describe, vi, beforeEach, afterEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterSettingsModal from "@/features/character/components/CharacterSettingsModal.svelte";
import { uiState } from "@/lib/stores/ui.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { Logger } from "@common/logger/Logger";

// Mock dependencies
vi.mock("@/features/character/stores/characterStore.svelte", () => {
    return {
        characterStore: {
            characters: [],
            update: vi.fn().mockResolvedValue(undefined),
            reorder: vi.fn(),
            add: vi.fn().mockResolvedValue(undefined),
        },
    };
});

vi.mock("@common/logger/Logger", () => ({
    Logger: {
        structured: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

describe("CharacterSettingsModal Component", () => {
    let mockCharacter: Character;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCharacter = {
            id: "char-1",
            specVersion: 0,
            name: "Test Character",
            description: "A test character",
            avatarUrl: "https://example.com/avatar.png",
            assets: { assets: [] },
            prompt: {
                description: "Character Description",
                authorsNote: "Author's Note",
                lorebook: {
                    config: { tokenLimit: 1000 },
                    data: [
                        {
                            id: "entry-1",
                            name: "Lore Entry",
                            content: "Lore Content",
                            condition: [{ type: "always" }],
                            multipleConditionResolveStrategy: "any",
                            enabled: true,
                            priority: 0,
                        },
                    ],
                },
            },
            executables: {
                runtimeSetting: { mem: undefined, timeout: 30000 },
                replaceHooks: { display: [], input: [], output: [], request: [] },
            },
            metadata: {
                author: "Test Author",
                license: "MIT",
                version: "1.0.0",
                distributedOn: "https://example.com",
                additionalInfo: "Notes",
            },
        };

        // Initialize uiState
        uiState.characterSettingsOpen = true;
        uiState.characterSettingsTarget = mockCharacter;

        // Initialize characterStore.characters for the index lookups
        characterStore.characters = [mockCharacter];
    });

    // Ensure timers are cleaned up even if test fails
    // This prevents pollution of other tests like ChatPersion.test.ts
    afterEach(() => {
        vi.useRealTimers();
    });

    test("renders modal when open", async () => {
        const { getByText, getByRole } = render(CharacterSettingsModal);

        // Check header
        await expect.element(getByText("Test Character Settings")).toBeInTheDocument();

        // Check sidebar tabs
        await expect.element(getByRole("button", { name: /Basic Settings/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Prompt Settings/i })).toBeInTheDocument();
    });

    test("switches tabs correctly", async () => {
        const { getByRole, getByText, getByLabelText } = render(CharacterSettingsModal);

        // Initial tab is basic
        await expect.element(getByLabelText(/Name/i)).toBeInTheDocument();

        // Switch to Prompt tab
        const promptTab = getByRole("button", { name: /Prompt Settings/i });
        await promptTab.click();

        // Wait for tab content
        await expect.element(getByRole("heading", { name: /Prompt Configuration/i })).toBeVisible();
        await expect.element(getByLabelText(/Character Prompt Description/i)).toBeVisible();

        // Switch to Lorebook tab
        const lorebookTab = getByRole("button", { name: /Lorebook Settings/i });
        await lorebookTab.click();
        await expect.element(getByText("Lorebook")).toBeVisible();
        await expect.element(getByText(/Entries \(1\)/i)).toBeVisible();
    });

    test("closes modal when close button is clicked", async () => {
        const { getByLabelText } = render(CharacterSettingsModal);

        const closeButton = getByLabelText("Close");
        await closeButton.click();

        expect(uiState.characterSettingsOpen).toBe(false);
    });

    test("autosaves when changes are made", async () => {
        const { getByLabelText } = render(CharacterSettingsModal);

        const nameInput = getByLabelText(/Name/i);
        await nameInput.fill("Updated Name");

        // Wait for debounce (300ms) + buffer
        await new Promise((r) => setTimeout(r, 600));

        expect(characterStore.update).toHaveBeenCalledWith(
            0,
            expect.objectContaining({
                name: "Updated Name",
            })
        );

        expect(Logger.structured).toHaveBeenCalledWith("character.autosave", expect.anything());
    });

    test("handles lorebook entry addition", async () => {
        const { getByRole, getByText } = render(CharacterSettingsModal);

        // Switch to Lorebook tab
        await getByRole("button", { name: /Lorebook Settings/i }).click();

        // Click Add Entry
        const addButton = getByRole("button", { name: /Add Entry/i });
        await addButton.click();

        // Check if new entry appears
        await expect.element(getByText(/Entries \(2\)/i)).toBeInTheDocument();
    });
});
