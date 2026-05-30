import { describe, it, expect, expectTypeOf } from "vitest";
import {
    withCharacter,
    updateArrayItem,
    removeArrayItem,
    replaceArrayItem,
    moveArrayItem,
    appendArrayItem,
    type Identifiable,
} from "@/lib/utils/characterState";
import type { Character } from "@arisutalk/character-spec/v0/Character";

interface MockIdentifiable extends Identifiable {
    name: string;
    value: number;
}

function createMockCharacter(overrides: Partial<Character> = {}): Character {
    return {
        name: "Test Character",
        description: "A test character",
        ...overrides,
    } as Character;
}

function createMockArray(): MockIdentifiable[] {
    return [
        { id: "1", name: "First", value: 10 },
        { id: "2", name: "Second", value: 20 },
        { id: "3", name: "Third", value: 30 },
    ];
}

describe("characterState utilities", () => {
    describe("withCharacter", () => {
        it("creates a deep clone and applies mutations", () => {
            const original = createMockCharacter({ name: "Original" });
            const updated = withCharacter(original, (draft) => {
                draft.name = "Modified";
            });

            expect(updated.name).toBe("Modified");
            expect(original.name).toBe("Original");
        });

        it("returns a new reference, not the original", () => {
            const original = createMockCharacter();
            const updated = withCharacter(original, () => {});

            expect(updated).not.toBe(original);
        });

        it("deep clones nested properties", () => {
            const original = createMockCharacter();
            const updated = withCharacter(original, (draft) => {
                (draft as any).nested = { deep: { value: 42 } };
            });

            expect((updated as any).nested.deep.value).toBe(42);
            expect((original as any).nested).toBeUndefined();
        });

        it("works with extended character types", () => {
            const extended = {
                ...createMockCharacter(),
                customField: "custom",
            } as Character & { customField: string };

            const result = withCharacter(extended, (draft) => {
                draft.customField = "updated";
            });

            expect(result.customField).toBe("updated");
        });
    });

    describe("updateArrayItem", () => {
        it("updates an item by id with shallow merge", () => {
            const arr = createMockArray();
            const result = updateArrayItem(arr, "2", { name: "Updated" });

            expect(result[1].name).toBe("Updated");
            expect(result[1].value).toBe(20); // unchanged
        });

        it("returns a new array reference", () => {
            const arr = createMockArray();
            const result = updateArrayItem(arr, "1", { name: "New" });

            expect(result).not.toBe(arr);
        });

        it("leaves other items unchanged", () => {
            const arr = createMockArray();
            const result = updateArrayItem(arr, "2", { name: "Updated" });

            expect(result[0]).toBe(arr[0]);
            expect(result[2]).toBe(arr[2]);
        });

        it("returns original array if id not found", () => {
            const arr = createMockArray();
            const result = updateArrayItem(arr, "nonexistent", { name: "New" });

            expect(result).toEqual(arr);
        });

        it("handles empty array", () => {
            const result = updateArrayItem([], "1", { name: "New" });
            expect(result).toEqual([]);
        });
    });

    describe("removeArrayItem", () => {
        it("removes an item by id", () => {
            const arr = createMockArray();
            const result = removeArrayItem(arr, "2");

            expect(result).toHaveLength(2);
            expect(result.find((item) => item.id === "2")).toBeUndefined();
        });

        it("returns a new array reference", () => {
            const arr = createMockArray();
            const result = removeArrayItem(arr, "1");

            expect(result).not.toBe(arr);
        });

        it("leaves array unchanged if id not found", () => {
            const arr = createMockArray();
            const result = removeArrayItem(arr, "nonexistent");

            expect(result).toEqual(arr);
        });

        it("handles empty array", () => {
            const result = removeArrayItem([], "1");
            expect(result).toEqual([]);
        });
    });

    describe("replaceArrayItem", () => {
        it("replaces an item at the specified index", () => {
            const arr = createMockArray();
            const newItem: MockIdentifiable = { id: "99", name: "New", value: 99 };
            const result = replaceArrayItem(arr, 1, newItem);

            expect(result[1]).toBe(newItem);
            expect(result[0]).toBe(arr[0]);
            expect(result[2]).toBe(arr[2]);
        });

        it("returns a new array reference", () => {
            const arr = createMockArray();
            const result = replaceArrayItem(arr, 0, { id: "x", name: "x", value: 0 });

            expect(result).not.toBe(arr);
        });

        it("handles replacing at index 0", () => {
            const arr = createMockArray();
            const newItem: MockIdentifiable = { id: "0", name: "Zero", value: 0 };
            const result = replaceArrayItem(arr, 0, newItem);

            expect(result[0]).toBe(newItem);
        });

        it("handles replacing at last index", () => {
            const arr = createMockArray();
            const newItem: MockIdentifiable = { id: "99", name: "Last", value: 99 };
            const result = replaceArrayItem(arr, 2, newItem);

            expect(result[2]).toBe(newItem);
        });
    });

    describe("moveArrayItem", () => {
        it("moves an item from one index to another", () => {
            const arr = createMockArray();
            const result = moveArrayItem(arr, 0, 2);

            // Moving index 0 to index 2: [1,2,3] -> [2,3,1]
            expect(result[0].id).toBe("2");
            expect(result[1].id).toBe("3");
            expect(result[2].id).toBe("1");
        });

        it("returns a new array reference", () => {
            const arr = createMockArray();
            const result = moveArrayItem(arr, 0, 1);

            expect(result).not.toBe(arr);
        });

        it("returns a new array when fromIndex equals toIndex", () => {
            const arr = createMockArray();
            const result = moveArrayItem(arr, 1, 1);

            expect(result).not.toBe(arr);
            expect(result).toEqual(arr);
        });

        it("moves item forward in the array", () => {
            const arr = createMockArray();
            const result = moveArrayItem(arr, 0, 1);

            expect(result[0].id).toBe("2");
            expect(result[1].id).toBe("1");
            expect(result[2].id).toBe("3");
        });

        it("moves item backward in the array", () => {
            const arr = createMockArray();
            const result = moveArrayItem(arr, 2, 0);

            expect(result[0].id).toBe("3");
            expect(result[1].id).toBe("1");
            expect(result[2].id).toBe("2");
        });
    });

    describe("appendArrayItem", () => {
        it("appends an item to the end of the array", () => {
            const arr = createMockArray();
            const newItem: MockIdentifiable = { id: "4", name: "Fourth", value: 40 };
            const result = appendArrayItem(arr, newItem);

            expect(result).toHaveLength(4);
            expect(result[3]).toBe(newItem);
        });

        it("returns a new array reference", () => {
            const arr = createMockArray();
            const result = appendArrayItem(arr, { id: "4", name: "Fourth", value: 40 });

            expect(result).not.toBe(arr);
        });

        it("handles appending to empty array", () => {
            const newItem: MockIdentifiable = { id: "1", name: "Only", value: 10 };
            const result = appendArrayItem([], newItem);

            expect(result).toHaveLength(1);
            expect(result[0]).toBe(newItem);
        });

        it("preserves existing items", () => {
            const arr = createMockArray();
            const newItem: MockIdentifiable = { id: "4", name: "Fourth", value: 40 };
            const result = appendArrayItem(arr, newItem);

            expect(result[0]).toBe(arr[0]);
            expect(result[1]).toBe(arr[1]);
            expect(result[2]).toBe(arr[2]);
        });
    });
});
