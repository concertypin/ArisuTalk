/// <reference types="vitest/browser" />
import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterCard from "@/features/character/components/CharacterCard.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

// Mock the opfsAdapter
vi.mock("@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter", () => ({
    opfsAdapter: {
        getAssetUrl: vi.fn().mockResolvedValue(null),
    },
    OpFSAssetStorageAdapter: vi.fn(),
}));

describe("CharacterCard Component", () => {
    let mockCharacter: Character;
    const mockOnEdit = vi.fn() satisfies () => void;
    const mockOnDelete = vi.fn() satisfies () => void;
    const mockOnExport = vi.fn() satisfies () => void;
    const mockOnMove = vi.fn() satisfies (direction: 1 | -1) => void;

    beforeEach(() => {
        mockCharacter = {
            id: "char-1",
            specVersion: 0,
            name: "Test Character",
            description: "A test character description",
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

        mockOnEdit.mockClear();
        mockOnDelete.mockClear();
        mockOnExport.mockClear();
        mockOnMove.mockClear();
    });

    test("renders character name and description", async () => {
        const { getByRole, getByText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
        });

        const heading = getByRole("heading", { name: "Test Character", level: 2 });
        await expect.element(heading).toBeVisible();

        const description = getByText("A test character description");
        await expect.element(description).toBeVisible();
    });

    test("renders avatar image when avatarUrl is provided", async () => {
        const { getByRole } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
        });

        const image = getByRole("img", { name: "Test Character" });
        await expect.element(image).toBeVisible();
        await expect.element(image).toHaveAttribute("src", "https://example.com/avatar.png");
    });

    test("renders initials as fallback when no avatar", async () => {
        const characterWithoutAvatar = {
            ...mockCharacter,
            avatarUrl: undefined,
        };

        const { getByText } = render(CharacterCard, {
            character: characterWithoutAvatar,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
        });

        const initials = getByText("TE");
        await expect.element(initials).toBeVisible();
    });

    test("shows action buttons on hover", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
            onMove: mockOnMove,
        });

        const editButton = getByLabelText("Edit character");
        await expect.element(editButton).toBeVisible();

        const deleteButton = getByLabelText("Delete character");
        await expect.element(deleteButton).toBeVisible();

        const exportButton = getByLabelText("Export character");
        await expect.element(exportButton).toBeVisible();
    });

    test("calls onEdit when edit button is clicked", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
        });

        const editButton = getByLabelText("Edit character");
        await editButton.click();

        expect(mockOnEdit).toHaveBeenCalledOnce();
    });

    test("calls onDelete when delete button is clicked", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
        });

        const deleteButton = getByLabelText("Delete character");
        await deleteButton.click();

        expect(mockOnDelete).toHaveBeenCalledOnce();
    });

    test("calls onExport when export button is clicked", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
        });

        const exportButton = getByLabelText("Export character");
        await exportButton.click();

        expect(mockOnExport).toHaveBeenCalledOnce();
    });

    test("disables move left button when isFirst is true", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
            onMove: mockOnMove,
            isFirst: true,
        });

        const moveLeftButton = getByLabelText("Move left");
        await expect.element(moveLeftButton).toBeDisabled();
    });

    test("disables move right button when isLast is true", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
            onMove: mockOnMove,
            isLast: true,
        });

        const moveRightButton = getByLabelText("Move right");
        await expect.element(moveRightButton).toBeDisabled();
    });

    test("calls onMove with correct direction when move buttons are clicked", async () => {
        const { getByLabelText } = render(CharacterCard, {
            character: mockCharacter,
            onEdit: mockOnEdit,
            onDelete: mockOnDelete,
            onExport: mockOnExport,
            onMove: mockOnMove,
        });

        const moveLeftButton = getByLabelText("Move left");
        await moveLeftButton.click();
        expect(mockOnMove).toHaveBeenCalledWith(-1);

        const moveRightButton = getByLabelText("Move right");
        await moveRightButton.click();
        expect(mockOnMove).toHaveBeenCalledWith(1);
    });
});
