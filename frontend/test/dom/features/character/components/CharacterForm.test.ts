import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
import CharacterForm from "@/features/character/components/CharacterForm.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

// Mock the characterStore
vi.mock("@/features/character/stores/characterStore.svelte", () => {
    const mockStore = {
        characters: [],
        importCharacter: vi.fn(),
        add: vi.fn(),
        delete: vi.fn(),
    };
    return {
        characterStore: mockStore,
        CharacterStore: vi.fn(),
    };
});

describe("CharacterForm Component", () => {
    let mockCharacter: Character;
    const mockOnSave = vi.fn() satisfies () => void;
    const mockOnCancel = vi.fn() satisfies () => void;
    const mockOnSubmit = vi.fn() satisfies (character: Character) => void;

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSave.mockClear();
        mockOnCancel.mockClear();
        mockOnSubmit.mockClear();

        mockCharacter = {
            id: "char-1",
            specVersion: 0,
            name: "Test Character",
            description: "A test character",
            avatarUrl: "https://example.com/avatar.png",
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
        };

        characterStore.characters = [];
        characterStore.importCharacter = vi.fn();
    });

    test("renders create form when no character is provided", () => {
        render(CharacterForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        expect(screen.getByRole("textbox", { name: /Name/i })).toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: /Description/i })).toBeInTheDocument();
    });

    test("renders edit form when character is provided", () => {
        render(CharacterForm, {
            props: {
                character: mockCharacter,
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        expect(screen.getByRole("textbox", { name: /Name/i })).toHaveValue("Test Character");
        expect(screen.getByRole("textbox", { name: /Description/i })).toHaveValue(
            "A test character"
        );
    });

    test("calls onSubmit when form is submitted", async () => {
        const user = userEvent.setup();
        render(CharacterForm, {
            props: {
                character: mockCharacter,
                onSubmit: mockOnSubmit,
                onSave: mockOnSave,
            },
        });

        const submitButton = screen.getByRole("button", { name: /Save/i });
        await user.click(submitButton);

        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Test Character",
                description: "A test character",
            })
        );
    });

    test("shows error message when name is empty", async () => {
        const user = userEvent.setup();
        const { container } = render(CharacterForm, {
            props: {
                onCancel: mockOnCancel,
            },
        });

        const nameInput = screen.getByRole("textbox", { name: /Name/i });
        await fillText(user, nameInput, ""); // Clear name

        const submitButton = screen.getByRole("button", { name: /Save/i });
        await user.click(submitButton);

        const errorMessage = container.querySelector(".alert-error");
        expect(errorMessage).toBeTruthy();
        expect(errorMessage?.textContent).toContain("Name is required");
    });

    test("calls onCancel when cancel button is clicked", async () => {
        const user = userEvent.setup();
        render(CharacterForm, {
            props: {
                onCancel: mockOnCancel,
            },
        });

        // Click cancel button in the active tab (Create New)
        const cancelButton = screen.getAllByRole("button", { name: /Cancel/i })[0];
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    test("has file upload input for importing", async () => {
        const user = userEvent.setup();
        render(CharacterForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        // Switch to the Import Card tab first, file input is inside that tab panel
        const importTab = screen.getByRole("radio", { name: "Import Card" });
        await user.click(importTab);

        expect(importTab).toBeChecked();
        expect(screen.getByRole("radio", { name: "Create New" })).not.toBeChecked();
        // DaisyUI shows a tab panel through CSS, which jsdom does not load. The panel structure is
        // what is left to check: the file input lives in the Import Card panel, not the Create New one.
        const fileInput = screen.getByLabelText("Character file input");
        const importPanel = fileInput.closest('[role="tabpanel"]');
        const createPanel = screen
            .getByRole("textbox", { name: /Name/i })
            .closest('[role="tabpanel"]');
        expect(importPanel).not.toBeNull();
        expect(createPanel).not.toBeNull();
        expect(importPanel).not.toBe(createPanel);
        expect(importPanel).toContainElement(fileInput);
        expect(createPanel).not.toContainElement(fileInput);
        // The panel that holds the input is the one that follows the Import Card radio.
        expect(importTab.nextElementSibling).toBe(importPanel);
    });

    test("handles character import", async () => {
        const user = userEvent.setup();
        characterStore.importCharacter = vi.fn().mockResolvedValue({
            success: true,
            character: mockCharacter,
        });

        render(CharacterForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        // Switch to the Import Card tab first
        const importTab = screen.getByRole("radio", { name: "Import Card" });
        await user.click(importTab);

        const fileInput = screen.getByLabelText("Character file input");
        await user.upload(
            fileInput,
            new File(['{"name":"Imported Char","specVersion":0}'], "character.arisc", {
                type: "application/json",
            })
        );

        await waitFor(() => expect(mockOnSave).toHaveBeenCalledOnce());
        expect(characterStore.importCharacter).toHaveBeenCalledOnce();
        const importedFile = vi.mocked(characterStore.importCharacter).mock.calls[0]?.[0];
        expect(importedFile?.name).toBe("character.arisc");
        expect(screen.queryByText(/Import failed|Invalid file format/)).not.toBeInTheDocument();
    });

    test("shows import error when import fails", async () => {
        const user = userEvent.setup();
        characterStore.importCharacter = vi.fn().mockResolvedValue({
            success: false,
            error: "Invalid file format",
        });

        render(CharacterForm, {
            props: {
                onSave: mockOnSave,
                onCancel: mockOnCancel,
            },
        });

        // Switch to the Import Card tab first
        const importTab = screen.getByRole("radio", { name: "Import Card" });
        await user.click(importTab);

        const fileInput = screen.getByLabelText("Character file input");
        await user.upload(
            fileInput,
            new File(['{"name":"Bad Char"}'], "bad.arisc", { type: "application/json" })
        );

        // The error is rendered in the Import Card panel, next to the file input.
        const importPanel = fileInput.closest<HTMLElement>('[role="tabpanel"]');
        expect(importPanel).not.toBeNull();
        expect(await within(importPanel!).findByText("Invalid file format")).toBeInTheDocument();
        expect(characterStore.importCharacter).toHaveBeenCalledOnce();
        expect(mockOnSave).not.toHaveBeenCalled();
    });
});
