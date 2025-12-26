/// <reference types="vitest/browser" />
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
    let mockOnSelect: any;
    let mockOnAdd: any;
    let mockOnPersona: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSelect = vi.fn();
        mockOnAdd = vi.fn();
        mockOnPersona = vi.fn();
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
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        await expect.element(getByLabelText("Character 1")).toBeVisible();
        await expect.element(getByLabelText("Character 2")).toBeVisible();
    });

    test("calls onSelect when character is clicked", async () => {
        const { container } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        // Wait for rendering and click the button directly
        await vi.waitFor(() => {
            const characterButton = container.querySelector('button[aria-label="Character 1"]');
            expect(characterButton).toBeTruthy();
        });

        const characterButton = container.querySelector('button[aria-label="Character 1"]') as HTMLButtonElement;
        characterButton.click();

        expect(mockOnSelect).toHaveBeenCalledWith("char-1");
    });

    test("calls onAdd when add character button is clicked", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const addButton = getByLabelText("Add Character");
        await addButton.click();

        expect(mockOnAdd).toHaveBeenCalled();
    });

    test("opens settings modal when settings button is clicked", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const settingsButton = getByLabelText("Settings");
        await settingsButton.click();

        expect(uiState.openSettingsModal).toHaveBeenCalled();
    });

    test("calls onPersona when personas button is clicked", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const personasButton = getByLabelText("Manage Personas");
        await personasButton.click();

        expect(mockOnPersona).toHaveBeenCalled();
    });

    test("highlights selected character", async () => {
        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: "char-1",
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const characterButton = getByLabelText("Character 1");
        // The inner div of the button has the rounded-xl shape when active
        const innerDiv = characterButton.locator("div");
        await expect.element(innerDiv).toHaveClass(/rounded-xl/);
    });

    test("renders divider before action buttons", async () => {
        const { container } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const divider = container.querySelector(".divider");
        expect(divider).toBeTruthy();
    });

    test("displays initials for characters without avatars", async () => {
        const charNoAvatar = [
            { ...mockCharacters[0], avatarUrl: undefined },
            { ...mockCharacters[1], avatarUrl: undefined },
        ];
        characterStore.characters = charNoAvatar;

        const { getByLabelText } = render(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const char1 = getByLabelText("Character 1");
        await expect.element(char1.getByText("CH", { exact: true })).toBeVisible();

        const char2 = getByLabelText("Character 2");
        await expect.element(char2.getByText("CH", { exact: true })).toBeVisible();
    });
});
