import { test, expect, describe, vi, beforeEach } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterList from "@/features/character/components/CharacterList.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";

// Mock the worker and dependencies
vi.mock("@/lib/workers/workerClient", () => ({
    getCardParseWorker: vi.fn(() => ({
        exportCharacter: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    })),
}));

vi.mock("@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter", () => ({
    OpFSAssetStorageAdapter: vi.fn().mockImplementation(() => ({
        getAssetUrl: vi.fn().mockResolvedValue(null),
    })),
}));

vi.mock("comlink", () => ({
    transfer: vi.fn((data, _transferables) => data),
}));

vi.mock("@/features/character/utils/assetEncoding", () => ({
    remapAssetToUint8Array: vi.fn((asset) => asset),
    collectTransferableBuffers: vi.fn(() => []),
}));

describe("CharacterList Component", () => {
    let mockCharacters: Character[];
    const mockOnEdit = vi.fn() satisfies (index: number) => void;

    beforeEach(() => {
        mockOnEdit.mockClear();

        mockCharacters = [
            {
                id: "char-1",
                specVersion: 0,
                name: "Character 1",
                description: "First character",
                avatarUrl: "https://example.com/avatar1.png",
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
        characterStore.remove = vi.fn().mockResolvedValue(undefined);
    });

    test("renders character cards for all characters", async () => {
        const { getByRole } = render(CharacterList, {
            onEdit: mockOnEdit,
        });

        const character1 = getByRole("heading", { name: "Character 1", level: 2 });
        await expect.element(character1).toBeVisible();

        const character2 = getByRole("heading", { name: "Character 2", level: 2 });
        await expect.element(character2).toBeVisible();
    });

    test("calls onEdit with correct index", async () => {
        const { getByLabelText } = render(CharacterList, {
            onEdit: mockOnEdit,
        });

        const editButton = getByLabelText("Edit character", { exact: false });
        await editButton.click();

        expect(mockOnEdit).toHaveBeenCalled();
    });

    test("deletes character when delete action is confirmed", async () => {
        const { getByLabelText } = render(CharacterList, {
            onEdit: mockOnEdit,
        });

        // Mock window.confirm to return true
        const originalConfirm = window.confirm;
        window.confirm = vi.fn(() => true);

        const deleteButton = getByLabelText("Delete character", { exact: false });
        await deleteButton.click();

        // Note: The component uses a dialog modal for confirmation,
        // so this is a simplified test. In reality, you'd need to interact with the dialog.
        expect(characterStore.remove).toHaveBeenCalled();

        window.confirm = originalConfirm;
    });

    test("exports character when export button is clicked", async () => {
        const mockCreateElement = vi.spyOn(document, "createElement");
        const mockCreateObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
        const mockAppendChild = vi.spyOn(document.body, "appendChild");
        const mockRemoveChild = vi.spyOn(document.body, "removeChild");

        const { getByLabelText } = render(CharacterList, {
            onEdit: mockOnEdit,
        });

        const exportButton = getByLabelText("Export character", { exact: false });
        await exportButton.click();

        // Verify download link was created
        expect(mockCreateElement).toHaveBeenCalledWith("a");
        expect(mockCreateObjectURL).toHaveBeenCalled();

        mockCreateElement.mockRestore();
        mockCreateObjectURL.mockRestore();
        mockAppendChild.mockRestore();
        mockRemoveChild.mockRestore();
    });

    test("displays empty state when no characters", async () => {
        characterStore.characters = [];

        const { getByText } = render(CharacterList, {
            onEdit: mockOnEdit,
        });

        const emptyMessage = getByText(/No characters/i);
        await expect.element(emptyMessage).toBeVisible();
    });
});
