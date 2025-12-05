import { describe, expect, it } from "vitest";
import InMemoryBlob from "@/adapters/vendor/InMemoryBlob";

describe("InMemoryBlob", () => {
    it("upload and get returns data URL", async () => {
        const client = new InMemoryBlob();
        const data = new Uint8Array([1, 2, 3, 4]);
        const url = await client.upload(data, "application/octet-stream");
        expect(url.startsWith("inmemory://")).toBe(true);

        const got = await client.get(url);
        expect(got).toMatch(/^data:application\/octet-stream;base64,/);
    });

    it("delete removes stored blob", async () => {
        const client = new InMemoryBlob();
        const data = new Uint8Array([5, 6, 7]);
        const url = await client.upload(data);
        const got1 = await client.get(url);
        expect(got1).not.toBeNull();
        await client.delete(url);
        const got2 = await client.get(url);
        expect(got2).toBeNull();
    });
});
