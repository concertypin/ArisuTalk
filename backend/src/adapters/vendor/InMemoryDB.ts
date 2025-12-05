import type {
    BaseDataDBClient,
    PaginationOptions,
    PaginationResult,
} from "@/adapters/StorageClientBase";
import { DataListOrder } from "@/adapters/StorageClientBase";
import type { DataType } from "@/schema";

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

    // biome-ignore lint/complexity/noUselessConstructor: Keep compatible signature
    constructor(_env?: Record<never, never>) {}
    async bumpDownloadCount(id: string): Promise<void> {
        const item = this.store.get(id);
        if (!item) return;
        const current = item.downloadCount ?? 0;
        const updated = {
            ...item,
            downloadCount: current + 1,
        } satisfies DataType;
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
     * Query items by name with pagination support. If DataType doesn't have a `name` property, returns empty array.
     * Performs a case-insensitive substring match.
     * @param name - name to search for
     * @param options - Pagination options including limit and pageToken.
     */
    async queryByName(
        name: string,
        options?: PaginationOptions,
    ): Promise<PaginationResult<DataType>> {
        if (!name) return { items: [] };
        const q = name.toString().toLowerCase();
        const allResults: DataType[] = [];
        for (const item of this.store.values()) {
            const maybeName = item.name;
            if (
                typeof maybeName === "string" &&
                maybeName.toLowerCase().includes(q)
            ) {
                allResults.push(item);
            }
        }

        // Apply pagination
        const limit = options?.limit || 10; // Default limit of 10
        const offset = options?.pageToken ? parseInt(options.pageToken, 10) : 0;
        const paginatedResults = allResults.slice(offset, offset + limit);

        // Determine if there's a next page
        let nextPageToken: string | undefined;
        if (offset + limit < allResults.length) {
            nextPageToken = String(offset + limit);
        }

        return {
            items: paginatedResults,
            nextPageToken,
            totalCount: allResults.length,
        };
    }

    /**
     * List all items with pagination support. If a simple "asc" / "desc" string is provided as order, it will reverse the array for "desc".
     * @param order - optional ordering hint (best-effort)
     * @param options - Pagination options including limit and pageToken.
     */
    async list(
        order?: DataListOrder,
        options?: PaginationOptions,
    ): Promise<PaginationResult<DataType>> {
        let items = Array.from(this.store.values());

        // Apply ordering
        if (order) {
            if (order === DataListOrder.NewestFirst) {
                items = items.sort(
                    (a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0),
                );
            } else if (order === DataListOrder.DownloadsFirst) {
                items = items.sort(
                    (a, b) => (b.downloadCount || 0) - (a.downloadCount || 0),
                );
            }
        }

        try {
            // biome-ignore lint/suspicious/noExplicitAny: Handle potential string input
            const ord = order as any;
            if (typeof ord === "string") {
                if (ord.toLowerCase() === "desc") items = items.reverse();
            }
        } catch {
            // ignore and return as-is
        }

        // Apply pagination
        const limit = options?.limit || 10; // Default limit of 10
        const offset = options?.pageToken ? parseInt(options.pageToken, 10) : 0;
        const paginatedResults = items.slice(offset, offset + limit);

        // Determine if there's a next page
        let nextPageToken: string | undefined;
        if (offset + limit < items.length) {
            nextPageToken = String(offset + limit);
        }

        return {
            items: paginatedResults,
            nextPageToken,
            totalCount: items.length,
        };
    }

    /**
     * Insert a new item. Generates and assigns an `id`.
     * @param item - item without id
     * @returns newly created item with id
     */
    async put(item: Omit<DataType, "id">): Promise<DataType> {
        const id = this.generateId();
        // biome-ignore lint/suspicious/noExplicitAny: casting to DataType
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
        item: Partial<DataType> & { id: DataType["id"] },
    ): Promise<DataType> {
        if (!item?.id) throw new Error("Missing id for update");
        if (!this.store.has(item.id)) throw new Error("Item not found");
        this.store.set(item.id, {
            // biome-ignore lint/suspicious/noExplicitAny: merging
            ...(this.store.get(item.id) as any),
            ...item,
        });
        return item as DataType;
    }
}
