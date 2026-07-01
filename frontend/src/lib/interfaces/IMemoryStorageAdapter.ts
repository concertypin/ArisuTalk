import type { MemoryEntry } from "@/lib/types/memory";

/**
 * Interface for memory storage adapters.
 * Handles persistence of character memory entries.
 */
export interface IMemoryStorageAdapter {
    /** Initialises the storage adapter (e.g. opens DB connection). */
    init(): Promise<void>;

    /**
     * Returns all memory entries for a given character.
     * Ordered by timestamp descending (newest first).
     */
    getMemories(characterId: string): Promise<MemoryEntry[]>;

    /**
     * Returns a single memory entry by ID.
     * @returns The entry, or `undefined` if not found.
     */
    getMemory(id: string): Promise<MemoryEntry | undefined>;

    /**
     * Creates or overwrites a memory entry.
     * Use this for both new memories and updates.
     */
    saveMemory(entry: MemoryEntry): Promise<void>;

    /**
     * Deletes a memory entry by ID.
     */
    deleteMemory(id: string): Promise<void>;

    /**
     * Deletes all memory entries for a given character.
     * Useful when clearing a character's data.
     */
    deleteMemoriesForCharacter(characterId: string): Promise<void>;

    /**
     * Queries memories by text content (fuzzy / contains match)
     * for relevance-based recall.
     */
    searchMemories(characterId: string, query: string): Promise<MemoryEntry[]>;
}
