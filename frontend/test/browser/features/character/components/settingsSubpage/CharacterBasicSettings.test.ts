import { test, expect, describe, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render } from "vitest-browser-svelte";
import { userEvent } from "vitest/browser";
import CharacterBasicSettings from "@/features/character/components/settingsSubpage/CharacterBasicSettings.svelte";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import type { IAssetStorageAdapter } from "@/lib/interfaces";
import { cloneDeep } from "lodash-es";
import { Logger } from "@common/logger/Logger";
import { characterStore } from "@/features/character/stores/characterStore.svelte";

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
    let onChangeSpy: Mock<(character: Character | null) => void>;

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
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await expect.element(getByLabelText("Name", { exact: true })).toBeVisible();
        await expect.element(getByLabelText("Description")).toBeVisible();
    });

    test("shows asset picker when image assets exist", async () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-1",
                name: "avatar.png",
                mimeType: "image/png",
                data: "local://opfs/avatar.png",
            },
        ];

        const { getByLabelText, getByText } = render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await expect.element(getByText("Select from assets:")).toBeVisible();
        await expect.element(getByLabelText("Select avatar.png as avatar")).toBeVisible();
    });

    test("calls onChange when an asset is clicked", async () => {
        const assetData = "local://opfs/avatar.png";
        mockCharacter.assets.assets = [
            {
                id: "asset-1",
                name: "avatar.png",
                mimeType: "image/png",
                data: assetData,
            },
        ];

        const { getByLabelText } = render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
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
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        const manualUrlInput = screen.getByRole("textbox", {
            name: "Avatar External URL / Storage Key",
            includeHidden: true,
            //includeHidden: true, // vitest-browser might handle this differently, but let's keep it safe
        });

        // Wait for potential async rendering (though not usually needed for initial render)
        // Check visibility.
        // Note: DaisyUI collapse uses checkbox. If not checked, content has max-height: 0 etc.
        await expect.element(manualUrlInput).not.toBeVisible();

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
            props: {
                context: () => ({
                    getCharacter: () => character,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        const preview = getByAltText("Avatar preview");
        await expect.element(preview).toBeVisible();
        await expect.element(preview).toHaveAttribute("src", character.avatarUrl);
    });

    test("falls back to a generated avatar when the preview fails to load", async () => {
        const character = cloneDeep(mockCharacter);
        // Not a decodable image, so the browser fires `error` on the preview deterministically.
        character.avatarUrl = "data:image/png;base64,AAAA";

        const { getByAltText } = render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => character,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await expect
            .element(getByAltText("Avatar preview"))
            .toHaveAttribute("src", expect.stringContaining("dicebear.com"));
    });

    describe("avatar preview loading", () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        test("revokes a blob URL that resolves after the component was unmounted", async () => {
            const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
            mockCharacter.assets.assets = [
                { id: "a-1", name: "one.png", mimeType: "image/png", data: "local://opfs/one.png" },
                { id: "a-2", name: "two.png", mimeType: "image/png", data: "local://opfs/two.png" },
            ];

            let resolveFirst: (url: string) => void = () => {};
            const getAssetUrlMock = vi.mocked(mockAssetStorage.getAssetUrl);
            getAssetUrlMock.mockClear();
            getAssetUrlMock.mockImplementationOnce(
                () =>
                    new Promise<string>((resolve) => {
                        resolveFirst = resolve;
                    })
            );

            const { unmount } = render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            // The first preview is now pending; tear the component down before it resolves.
            await vi.waitFor(() => expect(getAssetUrlMock).toHaveBeenCalledTimes(1));
            await unmount();
            expect(revokeSpy).not.toHaveBeenCalled();

            resolveFirst("blob:late-url");

            await vi.waitFor(() => expect(revokeSpy).toHaveBeenCalledWith("blob:late-url"));
            // Once aborted, the remaining assets must not be loaded at all.
            expect(getAssetUrlMock).toHaveBeenCalledTimes(1);
            expect(revokeSpy).toHaveBeenCalledTimes(1);
        });

        test("revokes loaded preview URLs on unmount", async () => {
            const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
            mockCharacter.assets.assets = [
                { id: "a-1", name: "one.png", mimeType: "image/png", data: "local://opfs/one.png" },
            ];

            const { getByLabelText, unmount } = render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            await expect.element(getByLabelText("Select one.png as avatar")).toBeVisible();
            await vi.waitFor(() =>
                expect(document.querySelector("img[src='blob:mock-url-one.png']")).not.toBeNull()
            );
            expect(revokeSpy).not.toHaveBeenCalled();

            await unmount();
            expect(revokeSpy).toHaveBeenCalledWith("blob:mock-url-one.png");
        });
    });

    describe("character removal", () => {
        afterEach(() => {
            vi.restoreAllMocks();
            characterStore.characters = [];
        });

        test("ignores a repeated Enter while deletion is still in flight", async () => {
            const other = { ...cloneDeep(mockCharacter), id: "char-0", name: "Other" };
            const next = { ...cloneDeep(mockCharacter), id: "char-2", name: "Next" };
            characterStore.characters = [mockCharacter, other, next];

            let finishRemoval: () => void = () => {};
            const removeSpy = vi.spyOn(characterStore, "remove").mockImplementation(
                () =>
                    new Promise<void>((resolve) => {
                        finishRemoval = resolve;
                    })
            );

            const { getByLabelText } = render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            const input = getByLabelText("Enter the character's name exactly");
            await input.fill(mockCharacter.name);
            await userEvent.keyboard("{Enter}");
            await userEvent.keyboard("{Enter}");

            expect(removeSpy).toHaveBeenCalledTimes(1);
            await expect.element(input).toBeDisabled();
            expect(onChangeSpy).not.toHaveBeenCalled();

            finishRemoval();
            await vi.waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(null));
        });

        test("re-enables the input and reports the error when deletion fails", async () => {
            vi.spyOn(Logger, "error").mockImplementation(() => {});
            characterStore.characters = [mockCharacter];
            const removeSpy = vi
                .spyOn(characterStore, "remove")
                .mockRejectedValueOnce(new Error("boom"))
                .mockResolvedValue(undefined);

            const { getByLabelText } = render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            const input = getByLabelText("Enter the character's name exactly");
            await input.fill(mockCharacter.name);
            await userEvent.keyboard("{Enter}");

            await vi.waitFor(() => expect(removeSpy).toHaveBeenCalledTimes(1));
            await expect.element(input).toBeEnabled();
            expect(onChangeSpy).not.toHaveBeenCalled();

            // A retry must be possible after a failure (disabling dropped the focus).
            await input.click();
            await userEvent.keyboard("{Enter}");
            await vi.waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(null));
            expect(removeSpy).toHaveBeenCalledTimes(2);
        });
    });
});
