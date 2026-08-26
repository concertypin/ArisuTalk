/**
 * @file Memory type definitions for the character memory system.
 * Memories are structured pieces of information stored per character
 * (facts, conversation excerpts, or summaries) with importance scoring
 * for relevance-based retrieval.
 */

/** The kind of memory stored. */
export type MemoryType = "fact" | "conversation" | "summary";

/**
 * A single memory entry for a character.
 * Importance (0–1) drives relevance ranking for context injection.
 * `lastAccessed` is updated on recall so frequently-used memories rank higher.
 */
export interface MemoryEntry {
    /** Unique identifier for this memory entry. */
    id: string;
    /** The character this memory belongs to. */
    characterId: string;
    /** The stored text content. */
    content: string;
    /** Classification of the memory. */
    type: MemoryType;
    /** ISO-8601 timestamp of when the memory was created. */
    timestamp: string;
    /**
     * Importance score 0–1 (1 = most important).
     * Used together with recency to rank memories for prompt injection.
     */
    importance: number;
    /** ISO-8601 timestamp of the last time this memory was accessed/recalled. */
    lastAccessed: string;
}

/**
 * Collection of memories scoped to a single character.
 * This is the primary unit loaded from storage for a given character session.
 */
export interface CharacterMemoryStore {
    /** The character these memories belong to. */
    characterId: string;
    /** All memory entries for this character. */
    memories: MemoryEntry[];
}
