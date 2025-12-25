import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterSidebar from "@/features/character/components/CharacterSidebar.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import { uiState } from "@/lib/stores/ui.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

// Mock uiState
vi.mock("@/lib/stores/ui.svelte", () => ({
    uiState: {
        openSettingsModal: vi.fn() satisfies () => void,
    },
}));

describe("CharacterSidebar Component", () => {
    let mockCharacters: Character[];

    beforeEach(() => {
        mockCharacters = [
            {
                id: "char-1",
                specVersion: 0,
                name: "Character 1",
                description: "First character",
                avatarUrl: undefined,
                assets: { assets: [] },
                prompt: {
                    description: "",
                    authorsNote: "",
                    lorebook: { config: { tokenLimit: 0 }, data: [] },
                },
                executables: {
                    runtimeSetting: { mem: undefined, timeout: 30000 },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                metadata: {
                    author: undefined,
                    license: "",
                    version: undefined,
                    distributedOn: undefined,
                    additionalInfo: undefined,
                },
            },
            {
                id: "char-2",
                specVersion: 0,
                name: "Character 2",
                description: "Second character",
                avatarUrl: undefined,
                assets: { assets: [] },
                prompt: {
                    description: "",
                    authorsNote: "",
                    lorebook: { config: { tokenLimit: 0 }, data: [] },
                },
                executables: {
                    runtimeSetting: { mem: undefined, timeout: 30000 },
                    replaceHooks: { display: [], input: [], output: [], request: [] },
                },
                metadata: {
                    author: undefined,
                    license: "",
                    version: undefined,
                    distributedOn: undefined,
                    additionalInfo: undefined,
                },
            },
        ];

        // Mock characterStore
        characterStore.characters = mockCharacters;
    });

    test("renders all character items", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: vi.fn(),
            onAdd: vi.fn(),
            onPersona: vi.fn(),
        });

        await expect.element(getByLabelText("Character 1")).toBeVisible();
        await expect.element(getByLabelText("Character 2")).toBeVisible();
    });

    test("calls onSelect when character is clicked", async () => {
        const mockOnSelect = vi.fn();
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: vi.fn(),
            onPersona: vi.fn(),
        });

        const characterButton = getByLabelText("Character 1");
        await characterButton.click();

        expect(mockOnSelect).toHaveBeenCalledWith("char-1");
    });

    test("calls onAdd when add character button is clicked", async () => {
        const mockOnAdd = vi.fn();
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: vi.fn(),
            onAdd: mockOnAdd,
            onPersona: vi.fn(),
        });

        const addButton = getByLabelText("Add Character");
        await addButton.click();

        expect(mockOnAdd).toHaveBeenCalled();
    });

    test("opens settings modal when settings button is clicked", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: vi.fn(),
            onAdd: vi.fn(),
            onPersona: vi.fn(),
        });

        const settingsButton = getByLabelText("Settings");
        await settingsButton.click();

        expect(uiState.openSettingsModal).toHaveBeenCalled();
    });

    test("calls onPersona when personas button is clicked", async () => {
        const mockOnPersona = vi.fn();
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: vi.fn(),
            onAdd: vi.fn(),
            onPersona: mockOnPersona,
        });

        const personasButton = getByLabelText("Manage Personas");
        await personasButton.click();

        expect(mockOnPersona).toHaveBeenCalled();
    });

    test("highlights selected character", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: "char-1",
            onSelect: vi.fn(),
            onAdd: vi.fn(),
            onPersona: vi.fn(),
        });

        // The selected character should have visual indication
        const characterButton = getByLabelText("Character 1");
        // The active character has a rounded-xl shape vs rounded-3xl for inactive
        await expect.element(characterButton).toHaveClass(/rounded-xl/);
    });

    test("renders divider before action buttons", async () => {
        const { getByRole } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: vi.fn(),
            onAdd: vi.fn(),
            onPersona: vi.fn(),
        });

        const divider = getByRole("separator");
        await expect.element(divider).toBeVisible();
    });

    test("displays initials for characters without avatars", async () => {
        const { getByText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: vi.fn(),
            onAdd: vi.fn(),
            onPersona: vi.fn(),
        });

        await expect.element(getByText("CH")).toBeVisible();
        await expect.element(getByText("CH")).toBeVisible();
    });
});
