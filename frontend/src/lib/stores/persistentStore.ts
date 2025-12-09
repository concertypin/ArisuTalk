import { writable, type Writable } from "svelte/store";
import { saveToBrowserStorage, loadFromBrowserStorage } from "../../storage";
import { debounce } from "../../utils";
import { getStorageKey } from "../utils/storageKey";

/**
 * Creates a writable Svelte store that automatically persists its value to browser storage.
 * @param {string} key The base key to use for browser storage.
 * @param {*} initialValue The initial value of the store.
 * @param {number} debounceMs The debounce delay for saving to storage.
 * @returns A Svelte store.
 */
export function persistentStore<T>(
    key: string,
    initialValue: T,
    debounceMs = 500
): Writable<T> {
    const prefixedKey = getStorageKey(key);
    const store = writable(initialValue);
    let loaded = false;

    // Load the initial value from storage asynchronously.
    loadFromBrowserStorage(prefixedKey, initialValue).then((value) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
            const merged = { ...initialValue, ...value };
            store.set(merged);
        } else {
            store.set(value);
        }
        loaded = true;
    });

    const debouncedSave = debounce((value) => {
        saveToBrowserStorage(prefixedKey, value);
    }, debounceMs);

    // Subscribe to changes and save to storage.
    store.subscribe((currentValue) => {
        // Only save to storage after the initial value has been loaded.
        if (loaded) {
            debouncedSave(currentValue);
        }
    });

    return store;
}
