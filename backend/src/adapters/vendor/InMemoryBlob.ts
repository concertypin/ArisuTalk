import { DBEnv } from "@/adapters/client";
import { BaseBlobStorageClient } from "@/adapters/StorageClientBase";

/**
 * Simple in-memory blob storage used for tests/dev.
 * Generates in-memory URLs of the form: inmemory://<id>
 */
export default class InMemoryBlob implements BaseBlobStorageClient {
    private static store = new Map<
        string,
        { data: Uint8Array; contentType?: string }
    >();

    constructor(_env?: DBEnv) {
        // In-memory client doesn't need env, but keep signature compatible.
    }

    private static idFromUrl(url: string): string | null {
        const prefix = "inmemory://";
        return url.startsWith(prefix) ? url.slice(prefix.length) : null;
    }

    private static uint8ToBase64(bytes: Uint8Array): string {
        // Convert in chunks to avoid stack/range issues for large arrays
        const chunkSize = 0x8000;
        const chunks: string[] = [];
        for (let i = 0; i < bytes.length; i += chunkSize) {
            chunks.push(
                String.fromCharCode(...bytes.subarray(i, i + chunkSize))
            );
        }
        return btoa(chunks.join(""));
    }

    async upload(
        buffer: ArrayBuffer | Uint8Array,
        contentType?: string
    ): Promise<string> {
        const bytes =
            buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
        const id = `${Date.now()}-${crypto.randomUUID()}`;
        InMemoryBlob.store.set(id, {
            data: new Uint8Array(bytes),
            contentType,
        });
        return `inmemory://${id}`;
    }

    async get(url: string): Promise<string | null> {
        const id = InMemoryBlob.idFromUrl(url);
        if (!id) return null;
        const entry = InMemoryBlob.store.get(id);
        if (!entry) return null;
        const base64 = InMemoryBlob.uint8ToBase64(entry.data);
        const ct = entry.contentType ?? "application/octet-stream";
        return `data:${ct};base64,${base64}`;
    }

    async delete(url: string): Promise<void> {
        const id = InMemoryBlob.idFromUrl(url);
        if (!id) return;
        InMemoryBlob.store.delete(id);
    }
}
