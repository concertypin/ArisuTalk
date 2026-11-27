import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
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

    test("renders character name and description", () => {
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
            },
        });

        const heading = screen.getByRole("heading", { name: "Test Character", level: 2 });
        expect(heading).toBeInTheDocument();

        const description = screen.getByText("A test character description");
        expect(description).toBeInTheDocument();
    });

    test("renders avatar image when avatarUrl is provided", () => {
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
            },
        });

        const image = screen.getByRole("img", { name: "Test Character" });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute("src", "https://example.com/avatar.png");
    });

    test("renders initials as fallback when no avatar", () => {
        const characterWithoutAvatar = {
            ...mockCharacter,
            avatarUrl: undefined,
        };

        const { container } = render(CharacterCard, {
            props: {
                character: characterWithoutAvatar,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
            },
        });

        // Search specifically for the initials container
        const initials = container.querySelector(".text-4xl.font-bold");
        expect(initials).toBeTruthy();
        expect(initials?.textContent?.trim()).toBe("TE");
    });

    test("shows action buttons on hover", () => {
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
                onMove: mockOnMove,
            },
        });

        const editButton = screen.getByLabelText("Edit");
        expect(editButton).toBeInTheDocument();

        const deleteButton = screen.getByLabelText("Delete");
        expect(deleteButton).toBeInTheDocument();

        const exportButton = screen.getByLabelText("Export");
        expect(exportButton).toBeInTheDocument();
    });

    test("calls onEdit when edit button is clicked", async () => {
        const user = userEvent.setup();
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
            },
        });

        const editButton = screen.getByLabelText("Edit");
        await user.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledOnce();
    });

    test("calls onDelete when delete button is clicked", async () => {
        const user = userEvent.setup();
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
            },
        });

        const deleteButton = screen.getByLabelText("Delete");
        await user.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledOnce();
    });

    test("calls onExport when export button is clicked", async () => {
        const user = userEvent.setup();
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
            },
        });

        const exportButton = screen.getByLabelText("Export");
        await user.click(exportButton);

        expect(mockOnExport).toHaveBeenCalledOnce();
    });

    test("disables move left button when isFirst is true", () => {
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
                onMove: mockOnMove,
                isFirst: true,
            },
        });

        const moveLeftButton = screen.getByLabelText("Move Backward");
        expect(moveLeftButton).toBeDisabled();
    });

    test("disables move right button when isLast is true", () => {
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
                onMove: mockOnMove,
                isLast: true,
            },
        });

        const moveRightButton = screen.getByLabelText("Move Forward");
        expect(moveRightButton).toBeDisabled();
    });

    test("calls onMove with correct direction when move buttons are clicked", async () => {
        const user = userEvent.setup();
        render(CharacterCard, {
            props: {
                character: mockCharacter,
                onEdit: mockOnEdit,
                onDelete: mockOnDelete,
                onExport: mockOnExport,
                onMove: mockOnMove,
            },
        });

        const moveLeftButton = screen.getByLabelText("Move Backward");
        await user.click(moveLeftButton);
        expect(mockOnMove).toHaveBeenCalledWith(-1);

        const moveRightButton = screen.getByLabelText("Move Forward");
        await user.click(moveRightButton);
        expect(mockOnMove).toHaveBeenCalledWith(1);
    });
});
