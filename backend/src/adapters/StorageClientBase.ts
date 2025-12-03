import type { DataType } from "@/schema";

/**
 * Pagination options for querying data items.
 */
export type PaginationOptions = {
    /**
     * Number of items to return per page.
     */
    limit: number;

    /**
     * Token for retrieving the next page of results.
     * This is typically returned from a previous query.
     */
    pageToken?: string;
};
export const paginationOptionsDefault: PaginationOptions = {
    limit: 10,
};
/**
 * Result of a paginated query.
 */
export type PaginationResult<T> = {
    /**
     * Array of items for the current page.
     */
    items: T[];

    /**
     * Token for retrieving the next page of results.
     * If null or undefined, there are no more pages.
     * It is typically(not nececcary) alphanumeric value.
     */
    nextPageToken?: string;

    /**
     * Total number of items (if available).
     * This might not be supported by all implementations.
     */
    totalCount?: number;
};

/**
 * Client for performing blob storage operations.
 *
 * Implementations should return a publicly accessible string (e.g. URL or key)
 * from upload, and must support reading and deletion of blobs by that string.
 */
export type BaseBlobStorageClient = {
    /**
     * Upload a binary buffer to storage.
     * @param buffer - The data to upload.
     * @param contentType - Optional MIME type of the content.
     * @returns A promise resolving to a storage identifier (e.g. URL).
     */
    upload(
        buffer: ArrayBuffer | Uint8Array,
        contentType?: string,
    ): Promise<string>;

    /**
     * Retrieve a blob by its storage identifier.
     * @param url - The storage identifier returned by upload.
     * @returns A promise resolving to the blob data URL or null if not found.
     */
    get(url: string): Promise<string | null>;

    /**
     * Delete a blob by its storage identifier.
     * @param url - The storage identifier to delete.
     * @returns A promise that resolves when deletion completes.
     */
    delete(url: string): Promise<void>;
};
/**
 * Client interface for data (domain objects) database operations.
 *
 * Provides methods to get, query, list, create (put), and delete data items.
 */
export type BaseDataDBClient = {
    /**
     * Get a data item by id.
     * @param id - Data id.
     * @returns The data item or null if not found.
     */
    get(id: string): Promise<DataType | null>;

    /**
     * Query data items by name.
     * @param name - Name to query by.
     * @param options [options=options] - Pagination options.
     * @returns Paginated result of matching data items.
     */
    queryByName(
        name: string,
        options: PaginationOptions,
    ): Promise<PaginationResult<DataType>>;

    /**
     * List data items with optional ordering.
     * @param order - Optional ordering hint.
     * @param options - Pagination options.
     * @returns Paginated result of data items.
     */
    list(
        order?: DataListOrder,
        options?: PaginationOptions,
    ): Promise<PaginationResult<DataType>>;

    /**
     * Create a new data item.
     * @param item - Data item fields excluding id.
     * @returns The created data item including generated id.
     */
    put(item: Omit<DataType, "id">): Promise<DataType>;

    /**
     * Delete a data item by id.
     * @param id - Data id to delete.
     */
    delete(id: string): Promise<void>;

    /**
     * Atomically increments the download count for a data item.
     * @param id - The id of the data item.
     */
    bumpDownloadCount(id: string): Promise<void>;

    /**
     * Update an existing data item. Implementations should perform an update
     * (not create) and return the updated item. This allows callers to modify
     * only existing records without generating duplicates.
     * @param item - Full DataType item including id to update.
     * @returns The updated data item.
     */
    update(item: Partial<DataType> & { id: DataType["id"] }): Promise<DataType>;
};

/**
 * Ordering options for listing data items.
 *
 * @enum {string}
 */
export const enum DataListOrder {
    /**
     * Newest first
     */
    NewestFirst = "newest_first",

    /**
     * Downloads first
     */
    DownloadsFirst = "downloads_first",

    /**
     * Undefined, decided by the implementation (usually DB's default order)
     */
    Undefined = "undefined",
}
