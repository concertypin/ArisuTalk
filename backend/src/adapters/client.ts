/**
 * @fileoverview
 * This module exports a DatabaseClient which is dynamically imported.
 * The vendor implementation can be only called via this proxy to avoid
 * loading unnecessary code in environments that don't need it.
 */

import { BaseBlobStorageClient, BaseDataDBClient } from "./StorageClientBase";

/**
 * Dynamically imports and returns the DatabaseClient.
 * Temporarily using InMemoryBlob as a placeholder.
 */
export const DataDBClient: () => Promise<BaseDataDBClient> = async () => {
    return new (await import("./vendor/InMemoryDB")).InMemoryDataDBClient();
};

/**
 * Dynamically imports and returns the BlobClient.
 * If S3_ENDPOINT is set in env, uses S3BlobStorageClient, otherwise InMemoryBlob.
 */
export const BlobClient: () => Promise<BaseBlobStorageClient> = async () => {
    if (import.meta.env.S3_ENDPOINT) {
        return new (await import("./vendor/s3-storage")).default();
    }
    return new (await import("./vendor/InMemoryBlob")).default();
};
