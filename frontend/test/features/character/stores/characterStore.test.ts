import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi, type Mocked } from "vitest";
import { CharacterStore } from "@/features/character/stores/characterStore.svelte";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { exampleCharacter } from "@/const/example_data";

const mockAdapter: Mocked<ICharacterStorageAdapter> = {
    init: vi.fn().mockResolvedValue(undefined),
    getAllCharacters: vi.fn().mockResolvedValue([]),
    saveCharacter: vi.fn().mockResolvedValue(undefined),
    deleteCharacter: vi.fn().mockResolvedValue(undefined),
    getCharacter: vi.fn().mockResolvedValue(undefined),
};

const defaultChar: Character = structuredClone(exampleCharacter);

describe("CharacterStore", () => {
    let store: CharacterStore;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.spyOn(console, "error").mockImplementation(() => {});
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

    it("should handle load errors gracefully", async () => {
        const errorAdapter = { ...mockAdapter };
        errorAdapter.getAllCharacters.mockRejectedValue(new Error("Load failed"));
        const errorStore = new CharacterStore(errorAdapter);
        await errorStore.initPromise;
        expect(errorStore.characters).toEqual([]);
    });

    it("should throw error on add failure", async () => {
        mockAdapter.saveCharacter.mockRejectedValueOnce(new Error("Save failed"));
        await expect(store.add(defaultChar)).rejects.toThrow("Save failed");
    });

    it("should throw error on remove failure", async () => {
        await store.add(defaultChar);
        mockAdapter.deleteCharacter.mockRejectedValue(new Error("Delete failed"));
        await expect(store.remove(0)).rejects.toThrow("Delete failed");
    });

    it("should throw error on update failure", async () => {
        await store.add(defaultChar);
        const updated: Character = { ...defaultChar, name: "Arisu" };
        mockAdapter.saveCharacter.mockRejectedValue(new Error("Update failed"));
        await expect(store.update(0, updated)).rejects.toThrow("Update failed");
    });
});
