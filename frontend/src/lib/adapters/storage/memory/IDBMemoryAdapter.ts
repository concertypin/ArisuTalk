import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { IMemoryStorageAdapter } from "@/lib/interfaces";
import type { MemoryEntry } from "@/lib/types/memory";

/**
 * IndexedDB-backed implementation of {@link IMemoryStorageAdapter}.
 *
 * Stores each memory entry as a row in the `memories` Dexie table,
 * keyed by the entry's `id`. The table is indexed on
 * `characterId`, `type`, `timestamp`, and `importance` for efficient
 * per-character queries and relevance-based sorting.
 */
export class IDBMemoryAdapter implements IMemoryStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async getMemories(characterId: string): Promise<MemoryEntry[]> {
        return this.db.memories
            .where("characterId")
            .equals(characterId)
            .reverse()
            .sortBy("timestamp");
    }

    async getMemory(id: string): Promise<MemoryEntry | undefined> {
        return this.db.memories.get(id);
    }

    async saveMemory(entry: MemoryEntry): Promise<void> {
        await this.db.memories.put(entry);
    }

    async deleteMemory(id: string): Promise<void> {
        await this.db.memories.delete(id);
    }

    async deleteMemoriesForCharacter(characterId: string): Promise<void> {
        await this.db.memories.where("characterId").equals(characterId).delete();
    }

    async searchMemories(characterId: string, query: string): Promise<MemoryEntry[]> {
        const all = await this.db.memories.where("characterId").equals(characterId).toArray();

        const lower = query.toLowerCase();
        return all
            .filter((m) => m.content.toLowerCase().includes(lower))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}

export default IDBMemoryAdapter;
