import { test, expect, describe, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/svelte";
import CharacterAssetsSettings from "@/features/character/components/settingsSubpage/CharacterAssetsSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { createTestCharacter } from "@test/utils/character";
import type { IAssetStorageAdapter } from "@/lib/interfaces";

// Mock the asset storage resolver
const mockAssetStorage: IAssetStorageAdapter = {
    init: vi.fn(async () => {}),
    saveAsset: vi.fn(async (name: string) => new URL(`local://opfs/${name}`)),
    getAssetUrl: vi.fn(async () => "blob:mock-url"),
    getAssetBlob: vi.fn(async () => new Blob()),
    deleteAsset: vi.fn(async () => {}),
};

vi.mock("@/features/character/adapters/assetStorage/assetStorageResolver", () => ({
    getAssetStorage: () => mockAssetStorage,
}));

describe("CharacterAssetsSettings Component", () => {
    let mockCharacter: Character;
    let onChangeSpy: Mock<(character: Character | null) => void>;

    beforeEach(() => {
        onChangeSpy = vi.fn(() => {});
        mockCharacter = createTestCharacter();
    });

    test("renders empty state correctly", () => {
        render(CharacterAssetsSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        expect(screen.getByText("No assets yet.")).toBeInTheDocument();
    });

    test("renders upload section", () => {
        const { container } = render(CharacterAssetsSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        const uploadInput = container.querySelector("#asset-upload");
        expect(uploadInput).toBeTruthy();

        const uploadButton = container.querySelector("button.btn-primary");
        expect(uploadButton).toBeTruthy();
    });

    test("shows image assets section when image exists", () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-1",
                name: "portrait.png",
                mimeType: "image/png",
                data: "local://opfs/portrait.png",
            },
        ];

        render(CharacterAssetsSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        expect(screen.getByText("Images")).toBeInTheDocument();
    });

    test("shows other assets section when non-image exists", () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-2",
                name: "script.js",
                mimeType: "application/javascript",
                data: "local://opfs/script.js",
            },
        ];

        render(CharacterAssetsSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        expect(screen.getByText("Other Assets (1)")).toBeInTheDocument();
    });

    test("calls onChange when deleting asset", async () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-3",
                name: "delete-me.png",
                mimeType: "image/png",
                data: "local://opfs/delete-me.png",
            },
        ];

        const { container } = render(CharacterAssetsSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        // Find the delete button (should be only one since we have only one asset)
        await waitFor(() => {
            const deleteButton = container.querySelector('button[aria-label="Delete asset"]');
            expect(deleteButton).toBeTruthy();
        });

        const deleteButton = container.querySelector(
            'button[aria-label="Delete asset"]'
        ) as HTMLButtonElement;
        deleteButton.click();

        await waitFor(() => {
            expect(onChangeSpy).toHaveBeenCalled();
        });
    });

    test("has draggable elements for reordering", async () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-4",
                name: "first.png",
                mimeType: "image/png",
                data: "local://opfs/first.png",
            },
            {
                id: "asset-5",
                name: "second.png",
                mimeType: "image/png",
                data: "local://opfs/second.png",
            },
        ];

        const { container } = render(CharacterAssetsSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await waitFor(() => {
            const draggables = container.querySelectorAll('[draggable="true"]');
            expect(draggables).toHaveLength(2);
        });

        const draggables = container.querySelectorAll('[draggable="true"]');
        expect(draggables).toHaveLength(2);
    });
});
