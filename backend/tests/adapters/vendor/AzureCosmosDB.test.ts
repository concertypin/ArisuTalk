import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DBEnv } from "@/adapters/client";

// Prepare module-level mocks (we will wire them to the mocked module below)
const mockFetchAll = vi.fn();
const mockQuery = vi.fn(() => ({ fetchAll: mockFetchAll }));
const mockItems = { query: mockQuery };
const mockContainer = { items: mockItems };
const mockDatabase = { container: vi.fn(() => mockContainer) };
const mockCosmosClient = vi.fn(() => ({ database: () => mockDatabase }));

// Auto-mock the module, then set the implementation for CosmosClient
vi.mock("@azure/cosmos");

import { CosmosClient } from "@azure/cosmos";

//@ts-expect-error It is a mock
CosmosClient.mockImplementation(mockCosmosClient);

import AzureCosmosDB from "@/adapters/vendor/AzureCosmosDB";

const env: DBEnv = {
    SECRET_AZURE_COSMOSDB_CONNECTION_STRING: "conn",
    SECRET_AZURE_COSMOSDB_DATABASE_NAME: "db",
    SECRET_AZURE_COSMOSDB_CONTAINER_NAME: "c",
    SECRET_CLERK_SECRET_KEY: "test-clerk-key",
    ENV_CLERK_PUBLIC_KEY: "test-clerk-pub",
};

describe("AzureCosmosDB", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("queryByName returns paginated resources and total count", async () => {
        // For resource query, return one item
        mockFetchAll.mockImplementationOnce(async () => ({
            resources: [
                { id: "1", name: "bob", author: "a", downloadCount: 0 },
            ],
        }));
        // For count query, return count
        mockFetchAll.mockImplementationOnce(async () => ({
            resources: [{ count: 1 }],
        }));

        const client = new AzureCosmosDB(env);
        const res = await client.queryByName("bob", {
            limit: 10,
            pageToken: "0",
        });
        expect(res.items.length).toBe(1);
        expect(res.totalCount).toBe(1);
    });

    it("list returns items and totalCount", async () => {
        mockFetchAll.mockImplementationOnce(async () => ({
            resources: [{ id: "1", name: "x", author: "a", downloadCount: 0 }],
        }));
        mockFetchAll.mockImplementationOnce(async () => ({
            resources: [{ count: 1 }],
        }));
        const client = new AzureCosmosDB(env);
        const res = await client.list(undefined, { limit: 10, pageToken: "0" });
        expect(res.items.length).toBe(1);
        expect(res.totalCount).toBe(1);
    });
});
