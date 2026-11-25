/// <reference types="vitest/browser" />
import { test, expect, describe, vi, beforeEach, onTestFinished } from "vitest";
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

    test("renders all character items", async () => {
        const { getByLabelText } = renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        await expect.element(getByLabelText("Character 1")).toBeVisible();
        await expect.element(getByLabelText("Character 2")).toBeVisible();
    });

    test("calls onSelect when character is clicked", async () => {
        const { container } = renderWithAppContext(CharacterSidebar, {
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

        const characterButton = container.querySelector(
            'button[aria-label="Character 1"]'
        ) as HTMLButtonElement;
        characterButton.click();

        expect(mockOnSelect).toHaveBeenCalledWith("char-1");
    });

    test("calls onAdd when add character button is clicked", async () => {
        const { getByLabelText } = renderWithAppContext(CharacterSidebar, {
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
        const { getByLabelText, appContext } = renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: null,
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        expect(appContext.appSettingsOpen).toBe(false);

        const settingsButton = getByLabelText("Settings");
        await settingsButton.click();

        expect(appContext.appSettingsOpen).toBe(true);
    });

    test("calls onPersona when personas button is clicked", async () => {
        const { getByLabelText } = renderWithAppContext(CharacterSidebar, {
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
        const { container } = renderWithAppContext(CharacterSidebar, {
            selectedCharacterId: "char-1",
            onSelect: mockOnSelect,
            onAdd: mockOnAdd,
            onPersona: mockOnPersona,
        });

        // Wait for rendering
        await vi.waitFor(() => {
            expect(container.querySelectorAll('[role="option"]').length).toEqual(2);
        });

        const options = container.querySelectorAll('[role="option"]');
        const selectedOptions = container.querySelectorAll('[aria-selected="true"]');
        expect(selectedOptions.length).toEqual(1);
        expect(selectedOptions[0]).toBe(options[0]);
    });

    describe("dragging one character over another", () => {
        /** Renders the sidebar and starts dragging the option at `from` over the option at `to`. */
        async function dragOver(from: number, to: number) {
            const { getByRole } = renderWithAppContext(CharacterSidebar, {
                selectedCharacterId: null,
                onSelect: mockOnSelect,
                onAdd: mockOnAdd,
                onPersona: mockOnPersona,
            });
            const options = getByRole("option");
            const dragged = options.nth(from);
            const target = options.nth(to);
            // Every character of the fixture is rendered before the drag starts.
            await expect.poll(() => options.elements()).toHaveLength(mockCharacters.length);

            dragged.element().dispatchEvent(new DragEvent("dragstart", { bubbles: true }));
            target
                .element()
                .dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true }));
            return { dragged, target };
        }

        test("shows the drop line below the target when dragging downward", async () => {
            const { dragged, target } = await dragOver(0, 1);

            await expect.element(target).toHaveClass("border-b-2");
            await expect.element(target).toHaveClass("border-primary");
            await expect.element(target).not.toHaveClass("border-t-2");
            await expect.element(dragged).toHaveClass("opacity-50");
        });

        test("shows the drop line above the target when dragging upward", async () => {
            const { dragged, target } = await dragOver(1, 0);

            await expect.element(target).toHaveClass("border-t-2");
            await expect.element(target).toHaveClass("border-primary");
            await expect.element(target).not.toHaveClass("border-b-2");
            await expect.element(dragged).toHaveClass("opacity-50");
        });

        test("removes the drop line when the drag ends", async () => {
            const { dragged, target } = await dragOver(0, 1);
            await expect.element(target).toHaveClass("border-b-2");

            dragged.element().dispatchEvent(new DragEvent("dragend", { bubbles: true }));

            await expect.element(target).not.toHaveClass("border-b-2");
            await expect.element(target).not.toHaveClass("border-primary");
            await expect.element(dragged).not.toHaveClass("opacity-50");
        });

        test("shows no drop line between a pinned and an unpinned character", async () => {
            characterStore.togglePin("char-1");
            onTestFinished(() => characterStore.togglePin("char-1"));

            const { dragged, target } = await dragOver(0, 1);

            // The dragged item is dimmed, so the drag has started and the drop line is withheld on purpose.
            await expect.element(dragged).toHaveClass("opacity-50");
            await expect.element(target).not.toHaveClass("border-b-2");
            await expect.element(target).not.toHaveClass("border-t-2");
            await expect.element(target).not.toHaveClass("border-primary");
        });
    });

    test("renders divider before action buttons", async () => {
        const { container } = renderWithAppContext(CharacterSidebar, {
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

        const { getByLabelText } = renderWithAppContext(CharacterSidebar, {
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
