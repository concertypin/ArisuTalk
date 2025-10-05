import { DBEnv } from "../client";
import { BaseBlobStorageClient } from "../StorageClientBase";

/**
 * Simple in-memory blob storage used for tests/dev.
 * Generates in-memory URLs of the form: inmemory://<id>
 */
export default class InMemoryBlob implements BaseBlobStorageClient {
    private static store = new Map<
        string,
        { data: ArrayBuffer; contentType?: string; createdAt: number }
    >();
    private static counter = 0;

    constructor(env: DBEnv) {}

    /**
     * Uploads a buffer and returns a generated in-memory URL.
     * A copy of the provided data is stored to avoid external mutation.
     */
    async upload(
        buffer: ArrayBuffer | Uint8Array,
        contentType?: string
    ): Promise<string> {
        // Normalize to a Uint8Array view
        const view =
            buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        // Copy the data to a new ArrayBuffer
        const copy = new Uint8Array(view.length);
        copy.set(view);
        const ab = copy.buffer.slice(0); // ensure independent ArrayBuffer

        const id = `${Date.now().toString(36)}-${(++InMemoryBlob.counter).toString(36)}`;
        const url = `inmemory://${id}`;

        InMemoryBlob.store.set(url, {
            data: ab,
            contentType,
            createdAt: Date.now(),
        });

        return url;
    }

    /**
     * Retrieves the ArrayBuffer for the given in-memory URL, or null if not found.
     * Returns a copy of the stored buffer.
     */
    async get(url: string): Promise<ArrayBuffer | null> {
        const record = InMemoryBlob.store.get(url);
        if (!record) return null;
        // Return a copy to avoid external mutation
        const view = new Uint8Array(record.data);
        const copy = new Uint8Array(view.length);
        copy.set(view);
        return copy.buffer;
    }

    /**
     * Deletes the stored blob for the given URL. No-op if the URL does not exist.
     */
    async delete(url: string): Promise<void> {
        InMemoryBlob.store.delete(url);
    }
}
