/**
 * Simple in-memory storage for scripts, behaving similarly to sessionStorage.
 */
export class IsolatedStorage extends Storage {
    private storage = new Map<string, string>();

    /**
     * Sets a value in the storage.
     * @param key The key to set.
     * @param value The value to set (will be stringified).
     */
    setItem(key: string, value: string): void {
        this.storage.set(key, value);
    }

    /**
     * Gets a value from the storage.
     * @param key The key to get.
     * @returns The value, or null if not found.
     */
    getItem(key: string): string | null {
        return this.storage.get(key) ?? null;
    }

    /**
     * Removes a value from the storage.
     * @param key The key to remove.
     */
    removeItem(key: string): void {
        this.storage.delete(key);
    }

    /**
     * Clears all values from the storage.
     */
    clear(): void {
        this.storage.clear();
    }

    /**
     * Gets the number of items in the storage.
     */
    get length(): number {
        return this.storage.size;
    }

    /**
     * Gets the key at the specified index.
     * @param index The index.
     * @returns The key, or null if index is out of bounds.
     */
    key(index: number): string | null {
        return Array.from(this.storage.keys())[index] ?? null;
    }
}
