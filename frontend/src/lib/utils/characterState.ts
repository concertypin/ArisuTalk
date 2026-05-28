/**
 * Safe character state update utilities.
 *
 * These utilities prevent array corruption bugs caused by lodash `merge`,
 * which merges arrays by index rather than replacing them. All functions
 * return new references for Svelte reactivity compatibility.
 */

import { cloneDeep } from "lodash-es";
import type { Character } from "@arisutalk/character-spec/v0/Character";

/**
 * Creates a deep clone of the character and applies a mutator function.
 * Returns the cloned+mutated character ready for `onChange`.
 *
 * @example
 * const updated = withCharacter(character, (draft) => {
 *     draft.name = "New Name";
 *     draft.description = "Updated";
 * });
 * onChange(updated);
 */
export function withCharacter<T extends Character>(character: T, mutator: (draft: T) => void): T {
    const draft = cloneDeep(character);
    mutator(draft);
    return draft;
}

/**
 * Identifiable object constraint for array utilities.
 */
export interface Identifiable {
    id: string;
}

/**
 * Updates an array item by `id` with shallow property assignment.
 * Uses `Object.assign` instead of `merge` to avoid index-based array corruption.
 *
 * @example
 * const newData = updateArrayItem(character.prompt.lorebook.data, entryId, {
 *     name: "New Name",
 *     enabled: true,
 * });
 */
export function updateArrayItem<T extends Identifiable>(
    arr: readonly T[],
    id: string,
    updates: Partial<T>
): T[] {
    return arr.map((item) => (item.id === id ? { ...item, ...updates } : item));
}

/**
 * Removes an array item by `id`.
 *
 * @example
 * const newData = removeArrayItem(character.prompt.lorebook.data, entryId);
 */
export function removeArrayItem<T extends Identifiable>(arr: readonly T[], id: string): T[] {
    return arr.filter((item) => item.id !== id);
}

/**
 * Replaces an array item at a specific index.
 *
 * @example
 * const newAssets = replaceArrayItem(character.assets.assets, index, updatedAsset);
 */
export function replaceArrayItem<T>(arr: readonly T[], index: number, item: T): T[] {
    const result = [...arr];
    result[index] = item;
    return result;
}

/**
 * Moves an array item from one index to another (for drag-and-drop).
 *
 * @example
 * const newAssets = moveArrayItem(character.assets.assets, draggedIndex, targetIndex);
 */
export function moveArrayItem<T>(arr: readonly T[], fromIndex: number, toIndex: number): T[] {
    if (fromIndex === toIndex) return [...arr];
    const result = [...arr];
    const [moved] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, moved);
    return result;
}

/**
 * Appends an item to an array.
 *
 * @example
 * const newData = appendArrayItem(character.prompt.lorebook.data, newEntry);
 */
export function appendArrayItem<T>(arr: readonly T[], item: T): T[] {
    return [...arr, item];
}
