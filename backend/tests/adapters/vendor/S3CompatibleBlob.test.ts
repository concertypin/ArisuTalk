import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock AwsClient from aws4fetch
const mockFetch = vi.fn();
const mockSign = vi.fn();
vi.mock("aws4fetch", () => ({
    AwsClient: vi.fn().mockImplementation(() => ({
        fetch: mockFetch,
        sign: mockSign,
    })),
}));

import type { DBEnv } from "@/adapters/client";
import S3BlobStorageClient from "@/adapters/vendor/S3CompatibleBlob";

const env: DBEnv = {
    SECRET_S3_ACCESS_KEY: "ak",
    SECRET_S3_SECRET_KEY: "sk",
    SECRET_S3_BUCKET_NAME: "bucket",
    SECRET_S3_REGION: "region",
    SECRET_S3_ENDPOINT: "s3.example.com",
    SECRET_CLERK_SECRET_KEY: "test-clerk-key",
    ENV_CLERK_PUBLIC_KEY: "test-clerk-pub",
};

describe("S3BlobStorageClient", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("upload calls fetch and returns key", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
        });
        const client = new S3BlobStorageClient(env);
        const data = new Uint8Array([1, 2, 3]);
        const key = await client.upload(data, "application/octet-stream");
        expect(typeof key).toBe("string");
        expect(mockFetch).toHaveBeenCalled();
        const call = mockFetch.mock.calls[0] as unknown[];
        const opts = call[1] as { method?: string } | undefined;
        expect(opts?.method).toBe("PUT");
    });

    it("get returns presigned url when object exists", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
        });
        mockSign.mockResolvedValue({
            url: "https://signed.example.com/object",
        });
        const client = new S3BlobStorageClient(env);
        const res = await client.get("some-key");
        expect(res).toBe("https://signed.example.com/object");
        // HEAD should have been called
        expect(mockFetch).toHaveBeenCalled();
    });

    it("delete calls DELETE and throws on error", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
        });
        const client = new S3BlobStorageClient(env);
        await expect(client.delete("some-key")).resolves.toBeUndefined();
        expect(mockFetch).toHaveBeenCalled();
    });
});
