import { beforeEach, describe, expect, it } from "vitest";
import { DataListOrder } from "@/adapters/StorageClientBase";
import InMemoryDataDBClient from "@/adapters/vendor/InMemoryDB";
import type { DataType } from "@/schema";

const now = Date.now();

describe("InMemoryDataDBClient", () => {
    let client: InMemoryDataDBClient;

    beforeEach(() => {
        client = new InMemoryDataDBClient();
    });

    it("put/get works and generates id", async () => {
        const item: Omit<DataType, "id"> = {
            name: "Alice",
            author: "user-1",
            additionalData: "http://example.com/blob",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: now,
        };

        const created = await client.put(item);
        expect(created.id).toBeTruthy();
        const fetched = await client.get(created.id);
        expect(fetched).not.toBeNull();
        expect(fetched?.name).toBe("Alice");
    });

    it("list honors order and pagination", async () => {
        // create several items
        for (let i = 0; i < 15; i++) {
            await client.put({
                name: `Item ${i}`,
                author: `u${i}`,
                additionalData: "x",
                downloadCount: i,
                encrypted: false,
                uploadedAt: now + i,
            });
        }

        const page1 = await client.list(DataListOrder.NewestFirst, {
            limit: 5,
            pageToken: "0",
        });
        expect(page1.items.length).toBe(5);
        // items are sorted newest first so first page should have highest uploadedAt
        expect(page1.items[0].uploadedAt ?? 0).toBeGreaterThan(
            page1.items[4].uploadedAt ?? 0,
        );

        const page2 = await client.list(DataListOrder.NewestFirst, {
            limit: 5,
            pageToken: String(5),
        });
        expect(page2.items.length).toBe(5);
        expect(page1.totalCount).toBeTruthy();
    });

    it("queryByName returns paginated results", async () => {
        await client.put({
            name: "bob",
            author: "a",
            additionalData: "x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: now,
        });
        await client.put({
            name: "bobby",
            author: "b",
            additionalData: "x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: now,
        });

        const res = await client.queryByName("bob", {
            limit: 1,
            pageToken: "0",
        });
        expect(res.items.length).toBe(1);
        expect(res.totalCount).toBeGreaterThanOrEqual(2);
    });

    it("update and bumpDownloadCount work", async () => {
        const created = await client.put({
            name: "to-update",
            author: "au",
            additionalData: "x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: now,
        });

        const updated = await client.update({
            id: created.id,
            name: "updated",
        });
        expect(updated.name).toBe("updated");

        await client.bumpDownloadCount(created.id);
        const after = await client.get(created.id);
        expect(after?.downloadCount).toBeDefined();
    });

    it("delete removes item", async () => {
        const created = await client.put({
            name: "to-delete",
            author: "au",
            additionalData: "x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: now,
        });
        await client.delete(created.id);
        const after = await client.get(created.id);
        expect(after).toBeNull();
    });
});
