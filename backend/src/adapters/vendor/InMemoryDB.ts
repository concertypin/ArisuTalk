import { DataType } from "@/schema";
import { DBEnv } from "@/adapters/client";
import { BaseDataDBClient, DataListOrder } from "@/adapters/StorageClientBase";

/**{
 * Simple in-memory implementation of BaseDataDBClient for tests and local usage.
 *
 * Notes:
 * - IDs are generated deterministically using a counter + timestamp to avoid external deps.
 * - queryByName performs a case-insensitive substring match on a `name` property if present.
 */
export default class InMemoryDataDBClient implements BaseDataDBClient {
    private store: Map<string, DataType> = new Map();
    private counter = 0;

    constructor(env: DBEnv) {}
    async bumpDownloadCount(id: string): Promise<void> {
        const item = this.store.get(id);
        if (!item) return;
        const current = (item as any).downloadCount ?? 0;
        const updated = {
            ...(item as any),
            downloadCount: current + 1,
        } as DataType;
        this.store.set(id, updated);
    }

    private generateId(): string {
        // Simple, collision-resistant-enough id for in-memory usage
        return `${Date.now()}-${++this.counter}`;
    }

    /**
     * Get an item by id.
     * @param id - item id
     * @returns the item or null if not found
     */
    async get(id: string): Promise<DataType | null> {
        return this.store.get(id) ?? null;
    }

    /**
     * Query items by name. If DataType doesn't have a `name` property, returns empty array.
     * Performs a case-insensitive substring match.
     * @param name - name to search for
     */
    async queryByName(name: string): Promise<DataType[]> {
        if (!name) return [];
        const q = name.toString().toLowerCase();
        const results: DataType[] = [];
        for (const item of this.store.values()) {
            const maybeName = (item as any)?.name;
            if (
                typeof maybeName === "string" &&
                maybeName.toLowerCase().includes(q)
            ) {
                results.push(item);
            }
        }
        return results;
    }

    /**
     * List all items. If a simple "asc" / "desc" string is provided as order, it will reverse the array for "desc".
     * @param order - optional ordering hint (best-effort)
     */
    async list(order?: DataListOrder): Promise<DataType[]> {
        const items = Array.from(this.store.values());
        try {
            const ord = order as any;
            if (typeof ord === "string") {
                if (ord.toLowerCase() === "desc") return items.reverse();
                return items;
            }
        } catch {
            // ignore and return as-is
        }
        return items;
    }

    /**
     * Insert a new item. Generates and assigns an `id`.
     * @param item - item without id
     * @returns newly created item with id
     */
    async put(item: Omit<DataType, "id">): Promise<DataType> {
        const id = this.generateId();
        const newItem = { ...(item as any), id } as DataType;
        this.store.set(id, newItem);
        return newItem;
    }

    /**
     * Delete an item by id. No-op if not present.
     * @param id - id to delete
     */
    async delete(id: string): Promise<void> {
        this.store.delete(id);
    }
    async update(
        item: Partial<DataType> & { id: DataType["id"] }
    ): Promise<DataType> {
        if (!item?.id) throw new Error("Missing id for update");
        if (!this.store.has(item.id)) throw new Error("Item not found");
        this.store.set(item.id, {
            ...(this.store.get(item.id) as any),
            ...item,
        });
        return item as DataType;
    }
}
