import { test, expect, describe, vi, beforeEach, onTestFinished } from "vitest";
import { fireEvent, screen, within } from "@testing-library/svelte";
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

    test("highlights selected character", () => {
        renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: "char-1",
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(2);
        expect(screen.getAllByRole("option", { selected: true })).toEqual([options[0]]);
    });

    describe("dragging one character over another", () => {
        /** Renders the sidebar and starts dragging the option at `from` over the option at `to`. */
        async function dragOver(from: number, to: number) {
            renderWithAppContext(CharacterSidebar, {
                selectedCharacterId: null,
                onSelect: mockOnSelect,
                onAdd: mockOnAdd,
                onPersona: mockOnPersona,
            });
            const options = screen.getAllByRole("option");
            // Every character of the fixture is rendered before the drag starts.
            expect(options).toHaveLength(mockCharacters.length);
            const dragged = options[from];
            const target = options[to];

            await fireEvent.dragStart(dragged);
            await fireEvent.dragOver(target);
            return { dragged, target };
        }

        test("shows the drop line below the target when dragging downward", async () => {
            const { dragged, target } = await dragOver(0, 1);

            expect(target).toHaveClass("border-b-2", "border-primary");
            expect(target).not.toHaveClass("border-t-2");
            expect(dragged).toHaveClass("opacity-50");
        });

        test("shows the drop line above the target when dragging upward", async () => {
            const { dragged, target } = await dragOver(1, 0);

            expect(target).toHaveClass("border-t-2", "border-primary");
            expect(target).not.toHaveClass("border-b-2");
            expect(dragged).toHaveClass("opacity-50");
        });

        test("removes the drop line when the drag ends", async () => {
            const { dragged, target } = await dragOver(0, 1);
            expect(target).toHaveClass("border-b-2");

            await fireEvent.dragEnd(dragged);

            expect(target).not.toHaveClass("border-b-2");
            expect(target).not.toHaveClass("border-primary");
            expect(dragged).not.toHaveClass("opacity-50");
        });

        test("shows no drop line between a pinned and an unpinned character", async () => {
            characterStore.togglePin("char-1");
            onTestFinished(() => characterStore.togglePin("char-1"));

            const { dragged, target } = await dragOver(0, 1);

            // The dragged item is dimmed, so the drag has started and the drop line is withheld on purpose.
            expect(dragged).toHaveClass("opacity-50");
            expect(target).not.toHaveClass("border-b-2");
            expect(target).not.toHaveClass("border-t-2");
            expect(target).not.toHaveClass("border-primary");
        });
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
