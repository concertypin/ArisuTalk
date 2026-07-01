/**
 * @file Memory store — reactive state for character memory entries.
 * Manages per-character memories with relevance-based recall and
 * automatic summary generation for old, low-importance entries.
 */

import type { MemoryEntry, MemoryType, IMemoryStorageAdapter } from "@/features/memory";
import { IDBMemoryAdapter } from "@/lib/adapters/storage/memory/IDBMemoryAdapter";
import { Logger } from "@common/logger/Logger";
import { SvelteDate } from "svelte/reactivity";

export class MemoryStore {
    /** All memory entries for the currently active character. */
    memories = $state<MemoryEntry[]>([]);
    /** The character whose memories are currently loaded. */
    activeCharacterId = $state<string | null>(null);

    private adapter: IMemoryStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IMemoryStorageAdapter) {
        this.adapter = adapter ?? new IDBMemoryAdapter();
        this.initPromise = this.initialize();
    }

    private async initialize(): Promise<void> {
        await this.adapter.init();
    }

    /**
     * Load memories for a specific character.
     * Sets `activeCharacterId` and populates `memories`.
     */
    async loadMemories(characterId: string): Promise<void> {
        this.activeCharacterId = characterId;
        this.memories = await this.adapter.getMemories(characterId);
    }

    /**
     * Add a new memory entry for the active character.
     * Timestamp and lastAccessed are set automatically.
     */
    async addMemory(
        content: string,
        type: MemoryType,
        importance = 0.5
    ): Promise<MemoryEntry | null> {
        if (!this.activeCharacterId) {
            Logger.warn("MemoryStore.addMemory called without an active character");
            return null;
        }

        const now = new SvelteDate().toISOString();
        const entry: MemoryEntry = {
            id: crypto.randomUUID(),
            characterId: this.activeCharacterId,
            content,
            type,
            timestamp: now,
            importance,
            lastAccessed: now,
        };

        await this.adapter.saveMemory(entry);
        this.memories = [entry, ...this.memories];
        return entry;
    }

    /**
     * Update an existing memory entry.
     */
    async updateMemory(
        id: string,
        updates: Partial<Pick<MemoryEntry, "content" | "importance" | "type">>
    ): Promise<void> {
        const existing = this.memories.find((m) => m.id === id);
        if (!existing) return;

        const updated: MemoryEntry = { ...existing, ...updates };
        await this.adapter.saveMemory(updated);
        this.memories = this.memories.map((m) => (m.id === id ? updated : m));
    }

    /**
     * Delete a memory entry by ID.
     */
    async deleteMemory(id: string): Promise<void> {
        await this.adapter.deleteMemory(id);
        this.memories = this.memories.filter((m) => m.id !== id);
    }

    /**
     * Recall memories for the active character, ranked by relevance.
     *
     * Scoring combines:
     *   - `importance` (the stored importance score)
     *   - `recency` (how recently the memory was created or accessed)
     *
     * @param query Optional text to filter memories by content match.
     * @param limit  Maximum number of results to return.
     * @returns Memories sorted by combined score (highest first).
     */
    async recallMemories(query?: string, limit = 20): Promise<MemoryEntry[]> {
        if (!this.activeCharacterId) return [];

        const pool = query
            ? await this.adapter.searchMemories(this.activeCharacterId, query)
            : this.memories;

        const now = Date.now();
        const scored = pool.map((m) => {
            const ageHours = (now - new SvelteDate(m.timestamp).getTime()) / 36e5;
            const accessHours = (now - new SvelteDate(m.lastAccessed).getTime()) / 36e5;

            // Recency factor: decays from 1 to 0 over ~72 hours
            const recency = Math.max(0, 1 - ageHours / 72);
            // Access factor: recently-accessed memories get a small boost
            const accessBoost = Math.max(0, 1 - accessHours / 168); // 1 week
            // Combined score: importance dominates, recency and access are modifiers
            const score = m.importance * 0.6 + recency * 0.25 + accessBoost * 0.15;

            return { entry: m, score };
        });

        scored.sort((a, b) => b.score - a.score);

        // Update lastAccessed for recalled entries
        const nowStr = new SvelteDate().toISOString();
        const top = scored.slice(0, limit);
        for (const { entry } of top) {
            entry.lastAccessed = nowStr;
            await this.adapter.saveMemory(entry);
        }

        return top.map(({ entry }) => entry);
    }

    /**
     * Summarize old, low-importance conversation memories.
     *
     * Finds conversation entries older than `maxAgeDays` with importance
     * below `minImportance` and replaces them with a single summary entry.
     * This prevents memory stores from growing unboundedly.
     *
     * @returns The summary entry if any memories were summarised, else null.
     */
    async summarizeOldMemories(maxAgeDays = 7, minImportance = 0.3): Promise<MemoryEntry | null> {
        if (!this.activeCharacterId) return null;

        const cutoff = new SvelteDate(Date.now() - maxAgeDays * 864e5).toISOString();

        const old = this.memories.filter(
            (m) => m.type === "conversation" && m.importance < minImportance && m.timestamp < cutoff
        );

        if (old.length === 0) return null;

        // Build a compact summary from the old entries
        const summaryContent = old
            .map((m) => `[${new SvelteDate(m.timestamp).toLocaleDateString()}] ${m.content}`)
            .join("\n");

        const summary = await this.addMemory(
            `Conversation summary (${old.length} entries):\n${summaryContent}`,
            "summary",
            0.4
        );
        if (!summary) return null;

        // Remove the original entries
        for (const entry of old) {
            await this.adapter.deleteMemory(entry.id);
        }
        this.memories = this.memories.filter((m) => !old.includes(m));

        return summary;
    }

    /**
     * Get the total number of memories for the active character.
     */
    get memoryCount(): number {
        return this.memories.length;
    }
}

/** Singleton memory store instance. */
export const memoryStore = new MemoryStore();
