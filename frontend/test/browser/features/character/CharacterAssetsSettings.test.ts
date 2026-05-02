/// <reference types="vitest/browser" />

import { test, expect, describe, vi, beforeEach, type Mock } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterAssetsSettings from "@/features/character/components/settingsSubpage/CharacterAssetsSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
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
    let onChangeSpy: Mock<(character: Character) => void>;

    beforeEach(() => {
        onChangeSpy = vi.fn(() => {});
        mockCharacter = {
            id: "char-1",
            specVersion: 0,
            name: "Test Character",
            description: "A test character",
            avatarUrl: "",
            assets: { assets: [] },
            prompt: {
                description: "",
                authorsNote: "",
                lorebook: { config: { tokenLimit: 0 }, data: [] },
            },
            executables: {
                runtimeSetting: { mem: undefined, timeout: 30000 },
                replaceHooks: {
                    display: [],
                    input: [],
                    output: [],
                    request: [],
                },
            },
            metadata: {
                author: "",
                license: "",
                version: "1.0.0",
                distributedOn: "",
                additionalInfo: "",
            },
        };
    });

    test("renders empty state correctly", async () => {
        const { getByText } = render(CharacterAssetsSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        await expect.element(getByText("No assets yet.")).toBeVisible();
    });

    test("renders upload section", async () => {
        const { container } = render(CharacterAssetsSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        const uploadInput = container.querySelector("#asset-upload");
        expect(uploadInput).toBeTruthy();

        const uploadButton = container.querySelector('button[aria-label="Upload Asset"]');
        expect(uploadButton).toBeTruthy();
    });

    test("shows image assets section when image exists", async () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-1",
                name: "portrait.png",
                mimeType: "image/png",
                data: "local://opfs/portrait.png",
            },
        ];

        const { getByText } = render(CharacterAssetsSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        await expect.element(getByText("Images")).toBeVisible();
    });

    test("shows other assets section when non-image exists", async () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-2",
                name: "script.js",
                mimeType: "application/javascript",
                data: "local://opfs/script.js",
            },
        ];

        const { getByText } = render(CharacterAssetsSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        await expect.element(getByText("Other Assets (1)")).toBeVisible();
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
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        // Find the delete button (should be only one since we have only one asset)
        await vi.waitFor(() => {
            const deleteButton = container.querySelector('button[aria-label="Delete asset"]');
            expect(deleteButton).toBeTruthy();
        });

        const deleteButton = container.querySelector(
            'button[aria-label="Delete asset"]'
        ) as HTMLButtonElement;
        deleteButton.click();

        await vi.waitFor(() => {
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
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        await vi.waitFor(() => {
            const draggables = container.querySelectorAll('[draggable="true"]');
            expect(draggables).toHaveLength(2);
        });

        const draggables = container.querySelectorAll('[draggable="true"]');
        expect(draggables).toHaveLength(2);
    });
});
