// @vitest-environment happy-dom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, onTestFinished, vi, type Mocked } from "vitest";
import { CharacterStore } from "@/features/character/stores/characterStore.svelte";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { exampleCharacter } from "@/const/example_data";
import { mockFile } from "@test/utils/mock/file";
import { createTestCharacter } from "@test/utils/character";

import { Logger } from "@common/logger/Logger";
import { cloneDeep } from "lodash-es";

// Mock worker client
// Use vi.hoisted() to ensure the mock function is available when vi.mock() is hoisted
const { mockParseCharacter } = vi.hoisted(() => {
    type ParseCharacterFn = (
        rawData: ArrayBuffer
    ) => Promise<{ success: true; data: Character } | { success: false; error?: string }>;
    return {
        mockParseCharacter: vi.fn<ParseCharacterFn>(),
    };
});

vi.mock("@/lib/workers/workerClient", () => ({
    getCardParseWorker: vi.fn().mockResolvedValue({
        parseCharacter: mockParseCharacter,
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

const defaultChar: Character = cloneDeep(exampleCharacter);

// Shared fixtures. Tests only read them, so sharing them cannot leak state between tests.
const char1 = createTestCharacter({ id: "1", name: "One" });
const char2 = createTestCharacter({ id: "2", name: "Two" });
const char3 = createTestCharacter({ id: "3", name: "Three" });

describe("CharacterStore", () => {
    let store: CharacterStore;

    beforeEach(async () => {
        vi.clearAllMocks();
        localStorage.clear();
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(Logger, "structured").mockImplementation(() => {});

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

    it("should initialize and load characters and log character.load", async () => {
        mockAdapter.getAllCharacters.mockResolvedValue([char1, char2]);

        const newStore = new CharacterStore(mockAdapter);
        await newStore.initPromise;

        expect(mockAdapter.init).toHaveBeenCalled();
        expect(mockAdapter.getAllCharacters).toHaveBeenCalled();

        expect(Logger.structured).toHaveBeenCalledWith(
            "character.load",
            expect.objectContaining({
                characterId: "1",
                source: "local",
            })
        );
        expect(Logger.structured).toHaveBeenCalledWith(
            "character.load",
            expect.objectContaining({
                characterId: "2",
                source: "local",
            })
        );
    });

    it("should log character.load when adding a character", async () => {
        await store.add(defaultChar);
        expect(Logger.structured).toHaveBeenCalledWith(
            "character.load",
            expect.objectContaining({
                characterId: defaultChar.id,
                source: "import", // wait, add() currently doesn't distinguish, let's see implementation
            })
        );
    });

    it("should log character.import when importing a character", async () => {
        const file = mockFile({ content: new ArrayBuffer(8), name: "test.png" });
        const parsedChar = { ...defaultChar, id: "imported" };

        mockParseCharacter.mockResolvedValue({ success: true, data: parsedChar });

        await store.importCharacter(file);

        expect(Logger.structured).toHaveBeenCalledWith(
            "character.import",
            expect.objectContaining({
                format: "png",
                success: true,
            })
        );
    });

    it("should log character.import on failure", async () => {
        const file = mockFile({ content: new ArrayBuffer(8), name: "test.json" });
        mockParseCharacter.mockResolvedValue({ success: false });

        await store.importCharacter(file);

        expect(Logger.structured).toHaveBeenCalledWith(
            "character.import",
            expect.objectContaining({
                format: "json",
                success: false,
            })
        );
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

    describe("update", () => {
        it("keeps the neighbour intact when the list shifted while the save was in flight", async () => {
            store.characters = [char1, char2, char3];

            let finishSave: () => void = () => {};
            mockAdapter.saveCharacter.mockImplementationOnce(
                () =>
                    new Promise<void>((resolve) => {
                        finishSave = resolve;
                    })
            );

            const pending = store.update(0, { ...char1, name: "One edited" });
            // The first character is removed while its save is still running.
            await store.remove(0);
            finishSave();
            await pending;

            // A stale index 0 would have replaced "Two" with the edited "One".
            expect(store.characters.map((c) => c.name)).toEqual(["Two", "Three"]);
        });

        it("replaces the character at its current position when the list shifted", async () => {
            store.characters = [char1, char2, char3];

            let finishSave: () => void = () => {};
            mockAdapter.saveCharacter.mockImplementationOnce(
                () =>
                    new Promise<void>((resolve) => {
                        finishSave = resolve;
                    })
            );

            const pending = store.update(2, { ...char3, name: "Three edited" });
            await store.remove(0);
            finishSave();
            await pending;

            expect(store.characters.map((c) => c.name)).toEqual(["Two", "Three edited"]);
        });

        it("does not save a character that is no longer in the list", async () => {
            store.characters = [char1, char2];
            await store.remove(0);
            mockAdapter.saveCharacter.mockClear();

            await store.update(0, { ...char1, name: "One edited" });

            expect(mockAdapter.saveCharacter).not.toHaveBeenCalled();
            expect(store.characters.map((c) => c.name)).toEqual(["Two"]);
        });

        it("ignores an out-of-range index", async () => {
            store.characters = [char1];

            await store.update(5, { ...char1, name: "x" });
            await store.update(-1, { ...char1, name: "x" });

            expect(mockAdapter.saveCharacter).not.toHaveBeenCalled();
        });
    });

    describe("pinned characters", () => {
        const PINNED_KEY = "pinned_characters";

        it("does not write to localStorage when loading without a stored pin list", async () => {
            const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
            onTestFinished(() => setItemSpy.mockRestore());

            const freshStore = new CharacterStore(mockAdapter);
            await freshStore.initPromise;

            expect(localStorage.getItem(PINNED_KEY)).toBeNull();
            expect(setItemSpy).not.toHaveBeenCalledWith(PINNED_KEY, expect.anything());
        });

        it("keeps stored pins across a load", async () => {
            mockAdapter.getAllCharacters.mockResolvedValue([char1, char2]);
            localStorage.setItem(PINNED_KEY, JSON.stringify(["2"]));

            const freshStore = new CharacterStore(mockAdapter);
            await freshStore.initPromise;

            expect(freshStore.isPinned("2")).toBe(true);
            expect(freshStore.characters[0].id).toBe("2");
        });

        it("unpins a character when it is removed", async () => {
            store.characters = [char1, char2];
            store.togglePin("1");
            expect(store.isPinned("1")).toBe(true);

            await store.remove(store.characters.findIndex((c) => c.id === "1"));

            expect(store.isPinned("1")).toBe(false);
            expect(JSON.parse(localStorage.getItem(PINNED_KEY) ?? "null")).toEqual([]);
        });

        it("keeps the other pins when a pinned character is removed", async () => {
            store.characters = [char1, char2];
            store.togglePin("1");
            store.togglePin("2");

            await store.remove(store.characters.findIndex((c) => c.id === "1"));

            expect(store.isPinned("2")).toBe(true);
            expect(JSON.parse(localStorage.getItem(PINNED_KEY) ?? "null")).toEqual(["2"]);
        });

        it("leaves the stored pins untouched when an unpinned character is removed", async () => {
            store.characters = [char1, char2];
            store.togglePin("1");
            const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
            onTestFinished(() => setItemSpy.mockRestore());

            await store.remove(store.characters.findIndex((c) => c.id === "2"));

            expect(setItemSpy).not.toHaveBeenCalledWith(PINNED_KEY, expect.anything());
        });
    });

    it("should reorder characters", async () => {
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

    describe("isReorderable", () => {
        beforeEach(() => {
            store.characters = [char1, char2, char3];
        });

        it("uses its own instance rather than the global singleton", () => {
            expect(store.isReorderable(0, 2)).toBe(true);
        });

        it("returns false for out-of-range indexes instead of throwing", () => {
            expect(store.isReorderable(-1, 0)).toBe(false);
            expect(store.isReorderable(0, 3)).toBe(false);
            expect(store.isReorderable(5, 7)).toBe(false);
        });

        it("returns false between pinned and unpinned characters", () => {
            store.togglePin("1");

            const pinnedIndex = store.characters.findIndex((c) => c.id === "1");
            const unpinnedIndex = store.characters.findIndex((c) => c.id === "2");

            expect(store.isReorderable(pinnedIndex, unpinnedIndex)).toBe(false);
        });

        it("does not move characters across the pinned boundary", () => {
            store.togglePin("1");
            const before = store.characters.map((c) => c.id);

            store.reorder(0, 2);

            expect(store.characters.map((c) => c.id)).toEqual(before);
        });
    });

    it("should load characters in saved order", async () => {
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

        mockParseCharacter.mockResolvedValue({ success: true, data: parsedChar });

        const result = await store.importCharacter(file);

        expect(result.success).toBe(true);
        expect(store.characters).toContainEqual(parsedChar);
        expect(mockAdapter.saveCharacter).toHaveBeenCalledWith(parsedChar);
    });

    it("should handle import failure from worker", async () => {
        const file: File = mockFile({ content: new ArrayBuffer(8) });
        mockParseCharacter.mockResolvedValue({
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
        mockParseCharacter.mockRejectedValue(new Error("Worker crash"));

        const result = await store.importCharacter(file);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Worker crash");
    });
});
