import { Hono } from "hono";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import InMemoryBlob from "@/adapters/vendor/InMemoryBlob";
import InMemoryDataDBClient from "@/adapters/vendor/InMemoryDB";
import type { AuthenticatedBindings } from "@/environmentTypes";

// Create shared in-memory instances so route handlers see the same state
const db = new InMemoryDataDBClient();
const blob = new InMemoryBlob();

vi.mock("@/adapters/client", () => ({
    DataDBClient: async () => db,
    BlobClient: async () => blob,
}));

// Lightweight auth router for tests
vi.mock("@/lib/auth", () => ({
    createAuthedHonoRouter: (_authLevel?: string) => {
        const r = new Hono<AuthenticatedBindings>();
        r.use("*", (c, next) => {
            const uid = c.req.header("x-user-id") || "user-1";
            c.set("user", {
                authUid: uid,
                name: "Test User",
                role: uid === "admin" ? "admin" : "known",
            });
            return next();
        });
        return r;
    },
}));

vi.mock("@hono/clerk-auth", () => ({
    clerkMiddleware: () => (_c: unknown, next: () => Promise<unknown>) =>
        next(),
    getAuth: (c: { req: Request }) => {
        const header = c.req.headers.get("x-user-id");
        if (header) return { userId: header };
        return { userId: "user-1" };
    },
}));

import { testClient } from "hono/testing";
import blobApp from "@/routes/blob";

const blobClient = testClient(blobApp);

beforeEach(() => {
    // No-op: shared in-memory instances persist within a test file run.
});

describe("routes/blob", () => {
    it("upload by author then GET redirects with data: URL and bumps download count", async () => {
        // create item directly in DB
        const created = await db.put({
            name: "WithBlob",
            author: "user-1",
            additionalData: "http://example.com/placeholder",
            encrypted: false,
            uploadedAt: Date.now(),
            downloadCount: 0,
        });

        const blobData = new Uint8Array([9, 8, 7]);
        const uploadRes = await blobClient.data[":id"].blob.$post(
            { param: { id: created.id } },
            {
                headers: { "x-user-id": "user-1" },
                init: {
                    body: blobData,
                    headers: { "content-type": "application/octet-stream" },
                },
            },
        );
        expect(uploadRes.status).toBe(200);
        const uploaded = await uploadRes.json();
        assert("url" in uploaded, "uploaded should have url");
        expect(typeof uploaded.url).toBe("string");
        expect(uploaded.url.startsWith("inmemory://")).toBe(true);

        // GET should redirect to data: URL and bump download count
        const getRes = await blobClient.data[":id"].blob.$get(
            { param: { id: created.id } },
            { headers: { "x-user-id": "user-1" } },
        );
        expect(getRes.status).toBe(307);
        const loc = getRes.headers.get("Location");
        expect(loc).toBeTruthy();
        expect(loc?.startsWith("data:")).toBe(true);

        // verify downloadCount bumped
        const after = await db.get(created.id);
        expect(after?.downloadCount).toBeGreaterThanOrEqual(1);
    });

    it("upload denies non-author non-admin", async () => {
        const created = await db.put({
            name: "NoUpload",
            author: "user-1",
            additionalData: "http://example.com/placeholder",
            encrypted: false,
            uploadedAt: Date.now(),
            downloadCount: 0,
        });

        const blobData = new Uint8Array([1]);
        const uploadRes = await blobClient.data[":id"].blob.$post(
            { param: { id: created.id } },
            {
                headers: { "x-user-id": "other-user" },
                init: { body: blobData },
            },
        );
        expect(uploadRes.status).toBe(403);
    });

    it("upload allowed for admin", async () => {
        const created = await db.put({
            name: "AdminUpload",
            author: "someone",
            additionalData: "http://example.com/placeholder",
            encrypted: false,
            uploadedAt: Date.now(),
            downloadCount: 0,
        });

        const blobData = new Uint8Array([2, 3]);
        const uploadRes = await blobClient.data[":id"].blob.$post(
            { param: { id: created.id } },
            {
                headers: { "x-user-id": "admin" },
                init: { body: blobData },
            },
        );
        expect(uploadRes.status).toBe(200);
        const body = await uploadRes.json();
        assert("url" in body, "body should have url");
        expect(typeof body.url).toBe("string");
    });

    it("upload to non-existent item returns 404", async () => {
        const blobData = new Uint8Array([4]);
        const uploadRes = await blobClient.data[":id"].blob.$post(
            { param: { id: "no-such-id" } },
            {
                headers: { "x-user-id": "admin" },
                init: { body: blobData },
            },
        );
        expect(uploadRes.status).toBe(404);
    });

    it("get returns 404 when no blob present on item", async () => {
        const created = await db.put({
            name: "NoBlobHere",
            author: "user-1",
            additionalData: "http://example.com/placeholder",
            encrypted: false,
            uploadedAt: Date.now(),
            downloadCount: 0,
        });

        const getRes = await blobClient.data[":id"].blob.$get(
            { param: { id: created.id } },
            { headers: { "x-user-id": "user-1" } },
        );
        expect(getRes.status).toBe(404);
    });

    it("get returns 404 when storage has no blob for given URL", async () => {
        // insert item with an additionalData pointing to non-existent storage id
        const created = await db.put({
            name: "MissingStorage",
            author: "user-1",
            additionalData: "inmemory://doesnotexist",
            encrypted: false,
            uploadedAt: Date.now(),
            downloadCount: 0,
        });

        const getRes = await blobClient.data[":id"].blob.$get(
            { param: { id: created.id } },
            { headers: { "x-user-id": "user-1" } },
        );
        expect(getRes.status).toBe(404);
    });

    // Note: intentionally omit invalid-id param test due to router validation behavior in test client
});
