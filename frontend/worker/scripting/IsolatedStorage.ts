/// <reference lib="DOM" />

/**
 * Simple in-memory storage for scripts, behaving similarly to sessionStorage.
 */
export class IsolatedStorage implements Storage {
    private storage: Record<string, string> = {};

    /**
     * Sets a value in the storage.
     * @param key The key to set.
     * @param value The value to set (will be stringified).
     */
    setItem(key: string, value: string): void {
        this.storage[key] = value;
    }

    /**
     * Gets a value from the storage.
     * @param key The key to get.
     * @returns The value, or null if not found.
     */
    getItem(key: string): string | null {
        return this.storage[key] ?? null;
    }

    /**
     * Removes a value from the storage.
     * @param key The key to remove.
     */
    removeItem(key: string): void {
        delete this.storage[key];
    }

    /**
     * Clears all values from the storage.
     */
    clear(): void {
        this.storage = {};
    }

    /**
     * Gets the number of items in the storage.
     */
    get length(): number {
        return Object.keys(this.storage).length;
    }

    /**
     * Gets the key at the specified index.
     * @param index The index.
     * @returns The key, or null if index is out of bounds.
     */
    key(index: number): string | null {
        return Object.keys(this.storage)[index] ?? null;
    }
}
