import { test, expect, describe, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterSidebar from "@/features/character/components/CharacterSidebar.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

describe("CharacterSidebar Component", () => {
    let mockCharacters: Character[];

    let mockOnSelect: (id: string | null) => void;
    let mockOnAdd: () => void;
    let mockOnPersona: () => void;

    beforeEach(async () => {
        // The store loads from storage asynchronously and would overwrite the characters set below.
        await characterStore.initPromise;

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

    test("renders all character items", () => {
        renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        expect(screen.getByLabelText("Character 1")).toBeInTheDocument();
        expect(screen.getByLabelText("Character 2")).toBeInTheDocument();
    });

    test("calls onSelect when character is clicked", async () => {
        const user = userEvent.setup();
        renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        await user.click(screen.getByRole("button", { name: "Character 1" }));

        expect(mockOnSelect).toHaveBeenCalledWith("char-1");
    });

    test("calls onAdd when add character button is clicked", async () => {
        const user = userEvent.setup();
        renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const addButton = screen.getByLabelText("Add Character");
        await user.click(addButton);

        expect(mockOnAdd).toHaveBeenCalled();
    });

    test("opens settings modal when settings button is clicked", async () => {
        const user = userEvent.setup();
        const { appContext } = renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        expect(appContext.appSettingsOpen).toBe(false);

        const settingsButton = screen.getByLabelText("Settings");
        await user.click(settingsButton);

        expect(appContext.appSettingsOpen).toBe(true);
    });

    test("calls onPersona when personas button is clicked", async () => {
        const user = userEvent.setup();
        renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const personasButton = screen.getByLabelText("Manage Personas");
        await user.click(personasButton);

        expect(mockOnPersona).toHaveBeenCalled();
    });

    test("highlights selected character", async () => {
        const { container } = renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: "char-1",
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        // Wait for rendering
        await waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toEqual(2);
        });

        const options = container.querySelectorAll('[role="option"]');
        const selectedOptions = container.querySelectorAll('[aria-selected="true"]');
        expect(selectedOptions.length).toEqual(1);
        expect(selectedOptions[0]).toBe(options[0]);
    });

    test("renders divider before action buttons", () => {
        const { container } = renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const divider = container.querySelector(".divider");
        expect(divider).toBeTruthy();
    });

    test("displays initials for characters without avatars", () => {
        const charNoAvatar = [
            { ...mockCharacters[0], avatarUrl: undefined },
            { ...mockCharacters[1], avatarUrl: undefined },
        ];
        characterStore.characters = charNoAvatar;

        renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const char1 = screen.getByRole("button", { name: "Character 1" });
        expect(within(char1).getByText("CH", { exact: true })).toBeInTheDocument();

        const char2 = screen.getByRole("button", { name: "Character 2" });
        expect(within(char2).getByText("CH", { exact: true })).toBeInTheDocument();
    });
});
