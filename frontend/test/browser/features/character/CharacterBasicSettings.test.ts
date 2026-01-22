/// <reference types="vitest/browser" />

import { test, expect, describe, vi, beforeEach, type Mock } from "vitest";
import { render } from "vitest-browser-svelte";
import CharacterBasicSettings from "@/features/character/components/settingsSubpage/CharacterBasicSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { IAssetStorageAdapter } from "@/lib/interfaces";
import { cloneDeep } from "lodash-es";

// Mock the asset storage resolver
const mockAssetStorage: IAssetStorageAdapter = {
    init: vi.fn(async () => {}),
    saveAsset: vi.fn(async (name: string) => new URL(`local://opfs/${name}`)),
    getAssetUrl: vi.fn(async (url: URL) => `blob:mock-url-${url.pathname.split("/").pop()}`),
    getAssetBlob: vi.fn(async () => new Blob()),
    deleteAsset: vi.fn(async () => {}),
};

vi.mock("@/features/character/adapters/assetStorage/assetStorageResolver", () => ({
    getAssetStorage: () => mockAssetStorage,
}));

describe("CharacterBasicSettings Component", () => {
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

    test("renders basic fields", async () => {
        const { getByLabelText } = render(CharacterBasicSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        await expect.element(getByLabelText("Name")).toBeVisible();
        await expect.element(getByLabelText("Description")).toBeVisible();
    });

    test("shows asset picker when image assets exist", async () => {
        mockCharacter.assets.assets = [
            {
                name: "avatar.png",
                mimeType: "image/png",
                data: "local://opfs/avatar.png",
            },
        ];

        const { getByLabelText, getByText } = render(CharacterBasicSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        await expect.element(getByText("Select from assets:")).toBeVisible();
        await expect.element(getByLabelText("Select avatar.png as avatar")).toBeVisible();
    });

    test("calls onChange when an asset is clicked", async () => {
        const assetData = "local://opfs/avatar.png";
        mockCharacter.assets.assets = [
            {
                name: "avatar.png",
                mimeType: "image/png",
                data: assetData,
            },
        ];

        const { getByLabelText } = render(CharacterBasicSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        const assetButton = getByLabelText("Select avatar.png as avatar");
        await assetButton.click();

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                avatarUrl: assetData,
            })
        );
    });

    test("manual URL settings is hidden by default but can be toggled", async () => {
        const screen = render(CharacterBasicSettings, {
            character: mockCharacter,
            onChange: onChangeSpy,
        });

        const manualUrlInput = screen.getByRole("textbox", {
            name: "Avatar External URL / Storage Key",
            includeHidden: true,
        });
        // DaisyUI collapse hides content using height/overflow/visibility
        await expect.element(manualUrlInput).not.toBeVisible();

        // DaisyUI collapse uses a hidden checkbox to control expand/collapse state.
        // Click the checkbox (via its label text) instead of the title text directly.
        const collapseCheckbox = screen.container.querySelector(
            ".collapse input[type='checkbox']"
        ) as HTMLInputElement;
        collapseCheckbox.click();

        await expect.element(manualUrlInput).toBeVisible();
    });

    test("shows avatar preview when avatarUrl is set", async () => {
        const character = cloneDeep(mockCharacter);
        character.avatarUrl = "https://example.com/avatar.png";

        const { getByAltText } = render(CharacterBasicSettings, {
            character,
            onChange: onChangeSpy,
        });

        const preview = getByAltText("Avatar preview");
        await expect.element(preview).toBeVisible();
        //await sleep(30)
        await expect.element(preview).toHaveAttribute("src", character.avatarUrl);
    });
});
