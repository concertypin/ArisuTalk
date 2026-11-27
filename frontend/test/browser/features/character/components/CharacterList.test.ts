import { test, expect, describe, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import CharacterList from "@/features/character/components/CharacterList.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { AssetEntity, Character } from "@arisutalk/character-spec/v0/Character";
import type * as comlink from "comlink";
// Mock the worker and dependencies
vi.mock("@/lib/workers/workerClient", () => ({
    getCardParseWorker: vi.fn(() => ({
        exportCharacter: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    })),
}));

vi.mock("@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter", () => {
    const mockAdapter = {
        getAssetUrl: vi.fn().mockResolvedValue(null),
    };
    return {
        // oxlint-disable-next-line typescript/no-explicit-any
        OpFSAssetStorageAdapter: vi.fn().mockImplementation(function (this: any) {
            return mockAdapter;
        }),
        opfsAdapter: mockAdapter,
    };
});

vi.mock(
    "comlink",
    () =>
        ({
            // oxlint-disable-next-line typescript/no-unsafe-return
            transfer: vi.fn((data, _transferables) => data) satisfies (typeof comlink)["transfer"],
        }) satisfies Partial<typeof comlink>
);

vi.mock("@/features/character/utils/assetEncoding", () => ({
    remapAssetToUint8Array: vi.fn((asset: AssetEntity) => asset),
    collectTransferableBuffers: vi.fn(() => []),
}));

describe("CharacterList Component", () => {
    let mockCharacters: Character[];
    const mockOnEdit = vi.fn() satisfies (index: number) => void;

    beforeEach(async () => {
        // The store loads from storage asynchronously and would overwrite the characters set below.
        await characterStore.initPromise;

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

    test("renders character cards for all characters", () => {
        render(CharacterList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const character1 = screen.getByRole("heading", { name: "Character 1", level: 2 });
        expect(character1).toBeInTheDocument();

        const character2 = screen.getByRole("heading", { name: "Character 2", level: 2 });
        expect(character2).toBeInTheDocument();
    });

    test("calls onEdit with correct index", async () => {
        const user = userEvent.setup();
        render(CharacterList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const editButton = screen.getAllByRole("button", { name: "Edit" })[0];
        await user.click(editButton);

        expect(mockOnEdit).toHaveBeenCalledWith(0);
    });

    test("deletes character when delete action is confirmed", async () => {
        const user = userEvent.setup();
        render(CharacterList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        // Click delete button on the first card to open modal
        await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

        // Find and click the confirmation button in the modal
        const confirmButton = await screen.findByText("Delete", { exact: true });
        await user.click(confirmButton);

        await waitFor(() => expect(characterStore.remove).toHaveBeenCalled());
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("exports character when export button is clicked", async () => {
        const user = userEvent.setup();
        const mockCreateElement = vi.spyOn(document, "createElement");
        const mockCreateObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:url");
        const mockAppendChild = vi.spyOn(document.body, "appendChild");
        const mockRemoveChild = vi.spyOn(document.body, "removeChild");

        render(CharacterList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const exportButton = screen.getAllByRole("button", { name: "Export" })[0];
        expect(exportButton).not.toBeDisabled();
        await user.click(exportButton);

        // Verify download link was created
        await waitFor(() => expect(mockCreateElement).toHaveBeenCalledWith("a"));
        expect(mockCreateObjectURL).toHaveBeenCalled();

        mockCreateElement.mockRestore();
        mockCreateObjectURL.mockRestore();
        mockAppendChild.mockRestore();
        mockRemoveChild.mockRestore();
    });

    test("displays empty state when no characters", () => {
        characterStore.characters = [];

        render(CharacterList, {
            props: {
                onEdit: mockOnEdit,
            },
        });

        const emptyMessage = screen.getByText(/No characters/i);
        expect(emptyMessage).toBeInTheDocument();
    });
});
