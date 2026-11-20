/// <reference types="vitest/browser" />

import { test, expect, describe, vi, beforeEach } from "vitest";
import { createTestAppContext, renderWithAppContext } from "@test/utils/appContext.svelte";
import CharacterSettingsModal from "@/features/character/components/CharacterSettingsModal.svelte";
import { characterStore } from "@/features/character/stores/characterStore.svelte";
import type { IAssetStorageAdapter } from "@/lib/interfaces";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { cloneDeep } from "lodash-es";

// The real store, backed by an adapter the test controls.
const adapter = vi.hoisted(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    getCharactersMetadata: vi.fn().mockResolvedValue([]),
    getAllCharacters: vi.fn().mockResolvedValue([]),
    saveCharacter: vi.fn().mockResolvedValue(undefined),
    deleteCharacter: vi.fn().mockResolvedValue(undefined),
    getCharacter: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/character/stores/characterStore.svelte", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("@/features/character/stores/characterStore.svelte")>();
    return { ...actual, characterStore: new actual.CharacterStore(adapter) };
});

const mockAssetStorage: IAssetStorageAdapter = {
    init: vi.fn(async () => {}),
    saveAsset: vi.fn(async (name: string) => new URL(`local://opfs/${name}`)),
    getAssetUrl: vi.fn(async () => "blob:unused"),
    getAssetBlob: vi.fn(async () => new Blob()),
    deleteAsset: vi.fn(async () => {}),
};

vi.mock("@/features/character/adapters/assetStorage/assetStorageResolver", () => ({
    getAssetStorage: () => mockAssetStorage,
}));

function createCharacter(id: string, name: string): Character {
    return {
        id,
        specVersion: 0,
        name,
        description: "",
        avatarUrl: "",
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
            author: "",
            license: "",
            version: "1.0.0",
            distributedOn: "",
            additionalInfo: "",
        },
    };
}

describe("CharacterSettingsModal removal", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        adapter.init.mockResolvedValue(undefined);
        adapter.getAllCharacters.mockResolvedValue([]);
        adapter.saveCharacter.mockResolvedValue(undefined);
        adapter.deleteCharacter.mockResolvedValue(undefined);
        // The initial load would otherwise overwrite the characters assigned below.
        await characterStore.initPromise;
    });

    test("an edit shortly before removal neither re-saves the deleted character nor overwrites its neighbour", async () => {
        const removed = createCharacter("char-1", "Removed");
        const neighbour = createCharacter("char-2", "Neighbour");
        const neighbourBefore = cloneDeep(neighbour);
        characterStore.characters = [removed, neighbour];

        let deleteStarted = false;
        let finishDelete: () => void = () => {};
        adapter.deleteCharacter.mockImplementation(() => {
            deleteStarted = true;
            return new Promise<void>((resolve) => {
                finishDelete = resolve;
            });
        });
        const savedDuringDeletion: string[] = [];
        adapter.saveCharacter.mockImplementation(async (c: Character) => {
            if (deleteStarted) savedDuringDeletion.push(c.id);
        });

        const selectCharacter = vi.fn() satisfies (charId: string | null) => void;
        const { getByLabelText, getByRole, appContext } = renderWithAppContext(
            CharacterSettingsModal,
            { character: removed, selectCharacter },
            createTestAppContext({ characterSettingsOpen: true, editingCharacter: removed })
        );

        // Type the confirmation first, so the edit and the removal are less than 300ms apart.
        await getByLabelText("Enter the character's name exactly").fill("Removed");
        await getByLabelText("Description").fill("edited just before removal");
        await getByRole("button", { name: "Remove", exact: true }).click();
        await vi.waitFor(() => expect(adapter.deleteCharacter).toHaveBeenCalledWith("char-1"));

        // Let the autosave debounce (300ms) elapse while the deletion is still in flight.
        await new Promise((r) => setTimeout(r, 500));
        finishDelete();

        await vi.waitFor(() => expect(selectCharacter).toHaveBeenCalledWith(null));
        expect(savedDuringDeletion).toEqual([]);
        expect(characterStore.characters.map((c) => c.id)).toEqual(["char-2"]);
        expect(characterStore.characters[0]).toEqual(neighbourBefore);
        expect(appContext.characterSettingsOpen).toBe(false);
    });
});
