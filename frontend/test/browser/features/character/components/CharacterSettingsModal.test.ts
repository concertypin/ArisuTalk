/// <reference types="vitest/browser" />

import { test, expect, describe, vi, beforeEach } from "vitest";
import { createTestAppContext, renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterSettingsModal from "@/features/character/components/CharacterSettingsModal.svelte";
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
    let selectCharacter: (charId: string | null) => void;

    /** Mounts the modal the way `CharacterLayout` does: while the app context marks it as open. */
    function renderModal() {
        return renderWithAppContext(
            CharacterSettingsModal,
            { character: mockCharacter, selectCharacter },
            createTestAppContext({ characterSettingsOpen: true, editingCharacter: mockCharacter })
        );
    }

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

        selectCharacter = vi.fn() satisfies (charId: string | null) => void;

        // Initialize characterStore.characters for the index lookups
        characterStore.characters = [mockCharacter];
    });

    test("renders modal when open", async () => {
        const { getByRole } = renderModal();

        // Check header
        await expect
            .element(
                getByRole("heading", { level: 2, name: "Test Character Settings", exact: true })
            )
            .toBeInTheDocument();

        // Check sidebar tabs
        await expect.element(getByRole("button", { name: /Basic/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Prompt/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Lorebook/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Assets/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Metadata/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Magic/i })).toBeInTheDocument();
        await expect.element(getByRole("button", { name: /Advanced/i })).toBeInTheDocument();
    });

    test("switches tabs correctly", async () => {
        const { getByRole, getByText, getByLabelText } = renderModal();

        // Initial tab is basic
        await expect.element(getByLabelText("Name", { exact: true })).toBeInTheDocument();

        // Switch to Prompt tab
        const promptTab = getByRole("button", { name: /^Prompt$/i });
        await promptTab.click();

        // Wait for tab content
        await expect.element(getByRole("heading", { name: /Prompt Configuration/i })).toBeVisible();
        await expect.element(getByLabelText(/Character Prompt Description/i)).toBeVisible();

        // Switch to Lorebook tab
        const lorebookTab = getByRole("button", { name: /^Lorebook$/i });
        await lorebookTab.click();
        await expect.element(getByRole("heading", { name: "Lorebook", level: 3 })).toBeVisible();
        await expect.element(getByText(/Entries \(1\)/i)).toBeVisible();
    });

    test("closes modal when close button is clicked", async () => {
        const { getByText, appContext } = renderModal();

        const closeButton = getByText("Close", { exact: true });
        await closeButton.click();

        expect(appContext.characterSettingsOpen).toBe(false);
        expect(appContext.editingCharacter).toBeNull();
    });

    test("autosaves when changes are made", async () => {
        const { getByLabelText } = renderModal();

        const nameInput = getByLabelText("Name", { exact: true });
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
        const { getByRole } = renderModal();

        // Switch to Lorebook tab
        await getByRole("button", { name: /^Lorebook$/i }).click();

        // Click Add Entry
        const addButton = getByRole("button", { name: /Add Entry/i });
        await addButton.click();

        // Check if new entry appears
        await expect
            .element(getByRole("heading", { level: 4, name: /Entries \(2\)/i }))
            .toBeInTheDocument();
    });

    test("opens the dialog once, however often the character is edited", async () => {
        const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, "showModal");
        try {
            const { getByLabelText } = renderModal();
            const nameInput = getByLabelText("Name", { exact: true });

            await nameInput.fill("Updated Name");
            await nameInput.fill("Updated Name Again");
            await expect.element(nameInput).toHaveValue("Updated Name Again");

            const openLogs = vi
                .mocked(Logger.structured)
                .mock.calls.filter(([event]) => event === "modal.open");
            expect(openLogs).toHaveLength(1);
            expect(showModalSpy).toHaveBeenCalledTimes(1);
        } finally {
            showModalSpy.mockRestore();
        }
    });

    test("shows only the subpage heading as an h3, without a duplicate character-name heading", async () => {
        const { getByRole } = renderModal();

        await expect
            .element(getByRole("heading", { level: 3, name: "Basic Information" }))
            .toBeVisible();

        const h3Texts = Array.from(document.querySelectorAll("h3")).map((h) =>
            h.textContent.trim()
        );
        expect(h3Texts).toEqual(["Basic Information"]);

        await getByRole("button", { name: /^Prompt$/i }).click();
        await expect
            .element(getByRole("heading", { level: 3, name: /Prompt Configuration/i }))
            .toBeVisible();
        expect(document.querySelectorAll("h3").length).toBe(1);
    });

    test("highlights the active tab with menu-active and moves it on click", async () => {
        const { getByRole } = renderModal();

        const basic = getByRole("button", { name: /^Basic$/i });
        const prompt = getByRole("button", { name: /^Prompt$/i });

        await expect.element(basic).toHaveClass("menu-active");
        await expect.element(prompt).not.toHaveClass("menu-active");

        await prompt.click();

        await expect.element(prompt).toHaveClass("menu-active");
        await expect.element(basic).not.toHaveClass("menu-active");
    });
});
