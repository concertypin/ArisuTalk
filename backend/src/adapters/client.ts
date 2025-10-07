/**
 * @fileoverview
 * This module exports a DatabaseClient which is dynamically imported.
 * The vendor implementation can be only called via this proxy to avoid
 * loading unnecessary code in environments that don't need it.
 */

import { RuntimeSecret, RuntimeVariable } from "types";
import {
    BaseBlobStorageClient,
    BaseDataDBClient,
} from "adapters/StorageClientBase";

/**
 * Environment variables required by the database and blob storage clients.
 * It will be passed to the client constructors.
 * Sorry for confusing naming, idk how to name it better.
 */
export type DBEnv = RuntimeSecret & RuntimeVariable;

let cachedDBClient: BaseDataDBClient | null = null;
let cachedBlobClient: BaseBlobStorageClient | null = null;

/**
 * Dynamically imports and returns the DatabaseClient.
 * Temporarily using InMemoryBlob as a placeholder.
 * It is created once and cached for subsequent calls.
 */
export async function DataDBClient(env: DBEnv): Promise<BaseDataDBClient> {
    if (cachedDBClient) return cachedDBClient;
    if (env.SECRET_AZURE_COSMOSDB_CONNECTION_STRING) {
        cachedDBClient = new (await import("./vendor/AzureCosmosDB")).default(
            env
        );
    } else {
        cachedDBClient = new (await import("./vendor/InMemoryDB")).default(env);
    }
    return cachedDBClient;
}

/**
 * Dynamically imports and returns the BlobClient.
 * If S3 environment variables are set, it uses S3Storage.
 */
export async function BlobClient(env: DBEnv): Promise<BaseBlobStorageClient> {
    if (cachedBlobClient) return cachedBlobClient;
    if (env.SECRET_S3_BUCKET_NAME) {
        return (cachedBlobClient = new (
            await import("./vendor/S3CompatibleBlob")
        ).default(env));
    }
    return (cachedBlobClient = new (
        await import("./vendor/InMemoryBlob")
    ).default(env));
}
