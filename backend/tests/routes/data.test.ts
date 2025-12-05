import { Hono } from "hono";
import { assert, describe, expect, it, vi } from "vitest";
import InMemoryBlob from "@/adapters/vendor/InMemoryBlob";
import InMemoryDataDBClient from "@/adapters/vendor/InMemoryDB";

// Create shared in-memory instances so route handlers see the same state
const db = new InMemoryDataDBClient();
const blob = new InMemoryBlob();

vi.mock("@/adapters/client", () => ({
    DataDBClient: async () => db,
    BlobClient: async () => blob,
}));

// Provide a lightweight auth router for tests so we don't need real Clerk env
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

// Mock clerk auth middleware and getAuth. Use request header `x-user-id`
// to vary the authenticated user per request in tests.
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
import type { AuthenticatedBindings } from "@/environmentTypes";
import blobApp from "@/routes/blob";
import app from "@/routes/data";

// Use testClient; linting for `any` is disabled for this test helper binding
const client = testClient(app);
const blobClient = testClient(blobApp);

describe("routes/data", () => {
    it("check returns 204 for authenticated user", async () => {
        const res = await client.check.$get();
        expect(res.status).toBe(204);
    });

    it("create -> get -> list works", async () => {
        const createRes = await client.data.$post({
            json: {
                additionalData: "http://example.com",
                encrypted: false,
                name: "MyData",
                author: "user-1",
                description: "Test data item",
                downloadCount: 0,
            },
        });
        expect(createRes.status).toBe(201);
        const created = await createRes.json();
        expect(created.id).toBeTruthy();
        expect(created.name).toBe("MyData");

        // get single
        const getRes = await client.data[":id"].$get({
            param: {
                id: created.id,
            },
        });
        expect(getRes.status).toBe(200);
        const single = await getRes.json();
        expect(single.id).toBe(created.id);

        // list
        const listRes = await client.data.$get({
            query: {},
        });
        expect(listRes.status).toBe(200);
        const list = await listRes.json();
        assert("items" in list, "items should be in list response");

        assert(Array.isArray(list.items));
        expect(list.items.find((i) => i.id === created.id)).toBeTruthy();
    });

    it("patch denies non-author and allows author", async () => {
        // create as default user (user-1)
        const createRes = await client.data.$post({
            json: {
                name: "PatchMe",
                author: "user-1",
                additionalData: "http://example.com",
                encrypted: false,
            },
        });
        const created = await createRes.json();

        // Attempt patch as different user -> should be Forbidden (403)
        const patchResForbidden = await client.data[":id"].$patch(
            {
                param: { id: created.id },
                json: { name: "Hacked" },
            },
            {
                headers: { "x-user-id": "other-user" },
            },
        );
        expect(patchResForbidden.status).toBe(403);

        // Patch as author -> succeeds
        const patchResOk = await client.data[":id"].$patch(
            {
                param: { id: created.id },
                json: { name: "UpdatedName" },
            },
            {
                headers: { "x-user-id": "user-1" },
            },
        );
        expect(patchResOk.status).toBe(200);
        const patched = await patchResOk.json();
        assert("name" in patched, "patched should have name");
        expect(patched.name).toBe("UpdatedName");
    });

    it("delete only allowed for admin or author (admin removes)", async () => {
        // create as default user
        const createRes = await client.data.$post({
            json: {
                name: "ToDelete",
                author: "user-1",
                additionalData: "http://example.com",
                encrypted: false,
            },
        });
        const created = await createRes.json();

        // Attempt delete as non-admin non-author -> Forbidden
        const delResForbidden = await client.data[":id"].$delete(
            { param: { id: created.id } },
            { headers: { "x-user-id": "other-user" } },
        );
        expect(delResForbidden.status).toBe(403);

        // Delete as admin -> OK
        const delResAdmin = await client.data[":id"].$delete(
            { param: { id: created.id } },
            { headers: { "x-user-id": "admin" } },
        );
        expect(delResAdmin.status).toBe(200);
        const delBody = await delResAdmin.json();
        assert("ok" in delBody, "delBody should have ok");
        expect(delBody.ok).toBe(true);
    });

    it("upload blob and then redirect to it", async () => {
        // create as user-1
        const createRes = await client.data.$post({
            json: {
                name: "WithBlob",
                author: "user-1",
                additionalData: "http://example.com",
                encrypted: false,
            },
        });
        const created = await createRes.json();

        // upload binary blob as author
        const blobData = new Uint8Array([1, 2, 3]);
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

        // fetch blob redirect
        const getBlobRes = await blobClient.data[":id"].blob.$get(
            { param: { id: created.id } },
            { headers: { "x-user-id": "user-1" } },
        );
        expect(getBlobRes.status).toBe(307);
        const loc = getBlobRes.headers.get("Location");
        expect(loc).toBeTruthy();
        expect(loc?.startsWith("data:")).toBe(true);
    });

    it("list pagination works with limit and pageToken", async () => {
        // populate db directly to avoid validator constraints
        const base = Date.now();
        for (let i = 0; i < 12; i++) {
            // each item needs required fields
            await db.put({
                name: `Paginated ${i}`,
                author: `u${i}`,
                additionalData: `http://blob/${i}`,
                downloadCount: i,
                encrypted: false,
                uploadedAt: base + i,
            });
        }

        const p1 = await client.data.$get({
            query: { limit: "5", pageToken: "0" },
        });
        expect(p1.status).toBe(200);
        const p1body = await p1.json();
        assert("items" in p1body, "p1body should have items");
        expect(p1body.items.length).toBe(5);
        expect(p1body.nextPageToken).toBeDefined();

        const p2 = await client.data.$get({
            query: { limit: "5", pageToken: p1body.nextPageToken },
        });
        expect(p2.status).toBe(200);
        const p2body = await p2.json();
        assert("items" in p2body, "p2body should have items");
        expect(p2body.items.length).toBe(5);
        // third page should have remaining 2 items
        const p3 = await client.data.$get({
            query: { limit: "5", pageToken: p2body.nextPageToken },
        });
        expect(p3.status).toBe(200);
        const p3body = await p3.json();
        assert("items" in p3body, "p3body should have items");
        expect(p3body.items.length).toBeGreaterThanOrEqual(1);
    });

    it("queryByName supports pagination and returns totalCount", async () => {
        // create matching items
        await db.put({
            name: "bob",
            author: "a",
            additionalData: "http://x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: Date.now(),
        });
        await db.put({
            name: "bobby",
            author: "b",
            additionalData: "http://x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: Date.now(),
        });
        await db.put({
            name: "alice",
            author: "c",
            additionalData: "http://x",
            downloadCount: 0,
            encrypted: false,
            uploadedAt: Date.now(),
        });

        const res = await client.data.$get({
            query: { name: "bob", limit: "1", pageToken: "0" },
        });
        expect(res.status).toBe(200);
        const body = await res.json();
        assert("items" in body, "body should have items");
        expect(body.items.length).toBe(1);
        expect(body.totalCount).toBeGreaterThanOrEqual(2);
        expect(body.nextPageToken).toBeDefined();
    });

    it("invalid query params return 400", async () => {
        const res = await client.data.$get({ query: { limit: "0" } });
        expect(res.status).toBe(400);
    });

    it("create with invalid body returns 400", async () => {
        // @ts-expect-error intentionally passing invalid body for test
        const res = await client.data.$post({ json: {} });
        expect(res.status).toBe(400);
    });
});
