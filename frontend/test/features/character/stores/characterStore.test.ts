import { describe, it, expect, beforeEach, vi } from "vitest";
import { CharacterStore } from "@/features/character/stores/characterStore.svelte";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";
import type { Character } from "@arisutalk/character-spec/v0/Character";

const mockAdapter: ICharacterStorageAdapter = {
    init: vi.fn().mockResolvedValue(undefined),
    getAllCharacters: vi.fn().mockResolvedValue([]),
    saveCharacter: vi.fn().mockResolvedValue(undefined),
    deleteCharacter: vi.fn().mockResolvedValue(undefined),
    getCharacter: vi.fn().mockResolvedValue(undefined),
};

const defaultChar: Character = {
    name: "Arisu",
    specVersion: 0,
    id: "",
    description: "",
    assets: { assets: [] },
    prompt: {
        description: "",
        authorsNote: "",
        lorebook: {
            config: {
                tokenLimit: 0,
            },
            data: [],
        },
    },
    executables: {
        runtimeSetting: {},
        replaceHooks: {
            display: [],
            input: [],
            output: [],
            request: [],
        },
    },
    metadata: {
        author: undefined,
        license: "",
        version: undefined,
        distributedOn: undefined,
        additionalInfo: undefined,
    },
};

describe("CharacterStore", () => {
    let store: CharacterStore;

    beforeEach(async () => {
        vi.clearAllMocks();
        store = new CharacterStore(mockAdapter);
        await store.initPromise;
    });

    it("should initialize and load characters", async () => {
        expect(mockAdapter.init).toHaveBeenCalled();
        expect(mockAdapter.getAllCharacters).toHaveBeenCalled();
        expect(store.characters).toEqual([]);
    });

    it("should add a character", async () => {
        await store.add(defaultChar);
        expect(mockAdapter.saveCharacter).toHaveBeenCalledWith(defaultChar);
        expect(store.characters).toContainEqual(defaultChar);
    });

    it("should remove a character", async () => {
        await store.add(defaultChar);
        await store.remove(0);
        // Assuming remove uses index and calls deleteCharacter with ID/Name
        expect(mockAdapter.deleteCharacter).toHaveBeenCalled();
        expect(store.characters).not.toContain(defaultChar);
    });

    it("should update a character", async () => {
        await store.add(defaultChar);

        const updated: Character = { ...defaultChar, name: "Arisu", description: "Updated" };
        await store.update(0, updated);

        expect(mockAdapter.saveCharacter).toHaveBeenCalledWith(updated);
        expect(store.characters[0]).toEqual(updated);
    });
});
