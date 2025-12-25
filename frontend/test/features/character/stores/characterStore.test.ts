import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, vi, type Mocked, type Mock } from "vitest";
import { CharacterStore } from "@/features/character/stores/characterStore.svelte";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { exampleCharacter } from "@/const/example_data";
import { getCardParseWorker } from "@/lib/workers/workerClient";
import { mockFile } from "@test/utils/mock/file";
import asMock from "@test/utils/asMock";

// Mock worker client
vi.mock("@/lib/workers/workerClient", () => ({
    getCardParseWorker: vi.fn().mockResolvedValue({
        parseCharacter: vi.fn(),
    }),
}));

const mockAdapter: Mocked<ICharacterStorageAdapter> = {
    init: vi.fn().mockResolvedValue(undefined),
    getCharactersMetadata: vi.fn().mockResolvedValue([]),
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
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});

        // Reset default adapter behavior
        mockAdapter.init.mockResolvedValue(undefined);
        mockAdapter.getCharactersMetadata.mockResolvedValue([]);
        mockAdapter.getAllCharacters.mockResolvedValue([]);
        mockAdapter.saveCharacter.mockResolvedValue(undefined);
        mockAdapter.deleteCharacter.mockResolvedValue(undefined);
        mockAdapter.getCharacter.mockResolvedValue(undefined);

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

    it("should reorder characters", async () => {
        const char1 = { ...defaultChar, id: "1", name: "One" };
        const char2 = { ...defaultChar, id: "2", name: "Two" };
        const char3 = { ...defaultChar, id: "3", name: "Three" };
        store.characters = [char1, char2, char3];

        // Move 0 to 2
        store.reorder(0, 2);
        // Expected: [char2, char3, char1]
        expect(store.characters[0]).toEqual(char2);
        expect(store.characters[1]).toEqual(char3);
        expect(store.characters[2]).toEqual(char1);

        // Verify order is saved in localStorage
        const storedOrder = JSON.parse(localStorage.getItem("character_order") || "[]") as string[];
        expect(storedOrder).toEqual(["2", "3", "1"]);
    });

    it("should load characters in saved order", async () => {
        const char1 = { ...defaultChar, id: "1", name: "One" };
        const char2 = { ...defaultChar, id: "2", name: "Two" };

        // Setup mock return
        mockAdapter.getAllCharacters.mockResolvedValue([char1, char2]);
        // Setup local storage order (reverse)
        localStorage.setItem("character_order", JSON.stringify(["2", "1"]));

        const newStore = new CharacterStore(mockAdapter);
        await newStore.initPromise;

        expect(newStore.characters[0]).toEqual(char2);
        expect(newStore.characters[1]).toEqual(char1);
    });

    it("should import character via worker", async () => {
        const file = mockFile({ content: new ArrayBuffer(8) });
        const parsedChar = { ...defaultChar, id: "imported" };

        const workerMock = await getCardParseWorker();
        asMock(workerMock.parseCharacter).mockResolvedValue({ success: true, data: parsedChar });

        const result = await store.importCharacter(file);

        expect(result.success).toBe(true);
        expect(store.characters).toContainEqual(parsedChar);
        expect(mockAdapter.saveCharacter).toHaveBeenCalledWith(parsedChar);
    });

    it("should handle import failure from worker", async () => {
        const file: File = mockFile({ content: new ArrayBuffer(8) });
        const workerMock = await getCardParseWorker();
        (workerMock.parseCharacter as Mock<typeof workerMock.parseCharacter>).mockResolvedValue({
            success: false,

            error: "Parse error",
        });

        const result = await store.importCharacter(file);
        expect(result.success).toBe(false);
        // The store currently ignores the worker error message and returns a generic one
        expect(result.error).toBe("Failed to parse character");
    });

    it("should handle import exception", async () => {
        const file: File = mockFile({ content: new ArrayBuffer(8) });
        const workerMock = await getCardParseWorker();
        (workerMock.parseCharacter as Mock<typeof workerMock.parseCharacter>).mockRejectedValue(
            new Error("Worker crash")
        );

        const result = await store.importCharacter(file);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Worker crash");
    });
});
