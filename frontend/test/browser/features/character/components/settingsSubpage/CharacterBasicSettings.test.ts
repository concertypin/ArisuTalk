import { test, expect, describe, vi, beforeEach, afterEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { fillText } from "@test/utils/user";
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

    test("renders basic fields", () => {
        render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        expect(screen.getByLabelText("Name", { exact: true })).toBeInTheDocument();
        expect(screen.getByLabelText("Description")).toBeInTheDocument();
    });

    test("shows asset picker when image assets exist", () => {
        mockCharacter.assets.assets = [
            {
                id: "asset-1",
                name: "avatar.png",
                mimeType: "image/png",
                data: "local://opfs/avatar.png",
            },
        ];

        render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        expect(screen.getByText("Select from assets:")).toBeInTheDocument();
        expect(screen.getByLabelText("Select avatar.png as avatar")).toBeInTheDocument();
    });

    test("calls onChange when an asset is clicked", async () => {
        const user = userEvent.setup();
        const assetData = "local://opfs/avatar.png";
        mockCharacter.assets.assets = [
            {
                id: "asset-1",
                name: "avatar.png",
                mimeType: "image/png",
                data: assetData,
            },
        ];

        render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        const assetButton = screen.getByLabelText("Select avatar.png as avatar");
        await user.click(assetButton);

        expect(onChangeSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                avatarUrl: assetData,
            })
        );
    });

    // jsdom loads no DaisyUI stylesheet, so whether the collapsed content is visible cannot be
    // measured. DaisyUI opens a `.collapse` through its checkbox (the checkbox must be a child of
    // `.collapse`, before `.collapse-content`), so that wiring and the default state are asserted.
    test("the manual URL input sits in a collapse that is closed by default", () => {
        render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => mockCharacter,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        const manualUrlInput = screen.getByRole("textbox", {
            name: "Avatar External URL / Storage Key",
        });
        const content = manualUrlInput.closest(".collapse-content");
        const collapse = content?.parentElement;
        expect(collapse).toHaveClass("collapse");
        const collapseCheckbox = collapse?.querySelector(":scope > input[type='checkbox']");
        expect(collapseCheckbox).not.toBeNull();

        expect(collapseCheckbox).not.toBeChecked();
        expect(collapse).toHaveTextContent("Manual URL Settings");
    });

    test("shows avatar preview when avatarUrl is set", () => {
        const character = cloneDeep(mockCharacter);
        character.avatarUrl = "https://example.com/avatar.png";

        render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => character,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        const preview = screen.getByAltText("Avatar preview");
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute("src", character.avatarUrl);
    });

    test("falls back to a generated avatar when the preview fails to load", async () => {
        const character = cloneDeep(mockCharacter);
        // jsdom never loads images, so the `error` event a browser fires for an undecodable image
        // is dispatched by hand below.
        character.avatarUrl = "data:image/png;base64,AAAA";

        render(CharacterBasicSettings, {
            props: {
                context: () => ({
                    getCharacter: () => character,
                    onCharacterChange: onChangeSpy,
                }),
            },
        });

        await fireEvent.error(screen.getByAltText("Avatar preview"));

        expect(screen.getByAltText("Avatar preview")).toHaveAttribute(
            "src",
            expect.stringContaining("dicebear.com")
        );
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
            await waitFor(() => expect(getAssetUrlMock).toHaveBeenCalledTimes(1));
            unmount();
            expect(revokeSpy).not.toHaveBeenCalled();

            resolveFirst("blob:late-url");

            await waitFor(() => expect(revokeSpy).toHaveBeenCalledWith("blob:late-url"));
            // Once aborted, the remaining assets must not be loaded at all.
            expect(getAssetUrlMock).toHaveBeenCalledTimes(1);
            expect(revokeSpy).toHaveBeenCalledTimes(1);
        });

        test("revokes loaded preview URLs on unmount", async () => {
            const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
            mockCharacter.assets.assets = [
                { id: "a-1", name: "one.png", mimeType: "image/png", data: "local://opfs/one.png" },
            ];

            const { unmount } = render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            expect(screen.getByLabelText("Select one.png as avatar")).toBeInTheDocument();
            await waitFor(() =>
                expect(document.querySelector("img[src='blob:mock-url-one.png']")).not.toBeNull()
            );
            expect(revokeSpy).not.toHaveBeenCalled();

            unmount();
            expect(revokeSpy).toHaveBeenCalledWith("blob:mock-url-one.png");
        });
    });

    describe("character removal", () => {
        beforeEach(async () => {
            // The initial load would otherwise overwrite the characters assigned by a test.
            await characterStore.initPromise;
        });

        afterEach(() => {
            vi.restoreAllMocks();
            characterStore.characters = [];
        });

        test("ignores a repeated Enter while deletion is still in flight", async () => {
            const user = userEvent.setup();
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

            render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            const input = screen.getByRole("textbox", {
                name: /Enter the character's name exactly/,
            });
            await fillText(user, input, mockCharacter.name);
            await user.keyboard("{Enter}");
            await user.keyboard("{Enter}");

            expect(removeSpy).toHaveBeenCalledTimes(1);
            expect(input).toBeDisabled();
            expect(onChangeSpy).not.toHaveBeenCalled();

            finishRemoval();
            await waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(null));
        });

        test("re-enables the input and reports the error when deletion fails", async () => {
            const user = userEvent.setup();
            vi.spyOn(Logger, "error").mockImplementation(() => {});
            characterStore.characters = [mockCharacter];
            const removeSpy = vi
                .spyOn(characterStore, "remove")
                .mockRejectedValueOnce(new Error("boom"))
                .mockResolvedValue(undefined);

            render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            const input = screen.getByRole("textbox", {
                name: /Enter the character's name exactly/,
            });
            await fillText(user, input, mockCharacter.name);
            await user.keyboard("{Enter}");

            await waitFor(() => expect(removeSpy).toHaveBeenCalledTimes(1));
            expect(input).toBeEnabled();
            expect(onChangeSpy).not.toHaveBeenCalledWith(null);

            // A retry must be possible after a failure (disabling dropped the focus).
            await user.click(input);
            await user.keyboard("{Enter}");
            await waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(null));
            expect(removeSpy).toHaveBeenCalledTimes(2);
        });

        function renderBasic() {
            return render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });
        }

        test("does not remove on the Enter that commits an IME composition", async () => {
            const user = userEvent.setup();
            characterStore.characters = [mockCharacter];
            const removeSpy = vi.spyOn(characterStore, "remove").mockResolvedValue(undefined);
            renderBasic();

            const input = screen.getByRole("textbox", {
                name: /Enter the character's name exactly/,
            });
            await fillText(user, input, mockCharacter.name);
            input.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true })
            );

            // Give a (wrong) async removal the chance to show up.
            await new Promise((r) => setTimeout(r, 50));
            expect(removeSpy).not.toHaveBeenCalled();
            expect(onChangeSpy).not.toHaveBeenCalled();

            // The same Enter after the composition ended removes.
            await user.keyboard("{Enter}");
            await waitFor(() => expect(removeSpy).toHaveBeenCalledTimes(1));
        });

        test("does not remove on Enter when the typed name differs", async () => {
            const user = userEvent.setup();
            characterStore.characters = [mockCharacter];
            const removeSpy = vi.spyOn(characterStore, "remove").mockResolvedValue(undefined);
            renderBasic();

            await fillText(
                user,
                screen.getByRole("textbox", { name: /Enter the character's name exactly/ }),
                "Test Characte"
            );
            await user.keyboard("{Enter}");

            await new Promise((r) => setTimeout(r, 50));
            expect(removeSpy).not.toHaveBeenCalled();
        });

        test("the Remove button stays disabled until the name matches, then removes", async () => {
            const user = userEvent.setup();
            characterStore.characters = [mockCharacter];
            const removeSpy = vi.spyOn(characterStore, "remove").mockResolvedValue(undefined);
            renderBasic();

            const removeButton = screen.getByRole("button", { name: "Remove" });
            expect(removeButton).toBeDisabled();

            const input = screen.getByRole("textbox", {
                name: /Enter the character's name exactly/,
            });
            await fillText(user, input, "wrong name");
            expect(removeButton).toBeDisabled();

            await fillText(user, input, mockCharacter.name);
            expect(removeButton).toBeEnabled();
            await user.click(removeButton);

            await waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(null));
            expect(removeSpy).toHaveBeenCalledTimes(1);
        });

        test("an empty character name never matches an empty confirmation field", async () => {
            const user = userEvent.setup();
            const unnamed = { ...cloneDeep(mockCharacter), name: "" };
            characterStore.characters = [unnamed];
            const removeSpy = vi.spyOn(characterStore, "remove").mockResolvedValue(undefined);
            render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => unnamed,
                        onCharacterChange: onChangeSpy,
                    }),
                },
            });

            expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();

            await user.click(
                screen.getByRole("textbox", { name: /Enter the character's name exactly/ })
            );
            await user.keyboard("{Enter}");

            await new Promise((r) => setTimeout(r, 50));
            expect(removeSpy).not.toHaveBeenCalled();
            expect(onChangeSpy).not.toHaveBeenCalled();
        });

        test("re-arms the autosave when the deletion fails after it was cancelled", async () => {
            const user = userEvent.setup();
            vi.spyOn(Logger, "error").mockImplementation(() => {});
            characterStore.characters = [mockCharacter];
            const cancelAutosave = vi.fn();
            vi.spyOn(characterStore, "remove").mockRejectedValue(new Error("boom"));
            render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                        cancelAutosave,
                    }),
                },
            });

            await fillText(
                user,
                screen.getByRole("textbox", { name: /Enter the character's name exactly/ }),
                mockCharacter.name
            );
            await user.keyboard("{Enter}");

            await waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(mockCharacter));
            expect(cancelAutosave).toHaveBeenCalledTimes(1);
            expect(onChangeSpy).not.toHaveBeenCalledWith(null);
        });

        test("the label says that Enter or the Remove button removes", () => {
            renderBasic();

            expect(screen.getByLabelText(/press Enter or click Remove/)).toBeInTheDocument();
        });

        test("cancels the pending autosave before the deletion starts", async () => {
            const user = userEvent.setup();
            characterStore.characters = [mockCharacter];
            const order: string[] = [];
            const cancelAutosave = vi.fn(() => {
                order.push("cancel");
            });
            vi.spyOn(characterStore, "remove").mockImplementation(async () => {
                order.push("remove");
            });
            render(CharacterBasicSettings, {
                props: {
                    context: () => ({
                        getCharacter: () => mockCharacter,
                        onCharacterChange: onChangeSpy,
                        cancelAutosave,
                    }),
                },
            });

            await fillText(
                user,
                screen.getByRole("textbox", { name: /Enter the character's name exactly/ }),
                mockCharacter.name
            );
            await user.keyboard("{Enter}");

            await waitFor(() => expect(onChangeSpy).toHaveBeenCalledWith(null));
            expect(order).toEqual(["cancel", "remove"]);
        });
    });
});
