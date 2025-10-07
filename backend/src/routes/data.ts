import z from "zod";
import { DataDBClient, BlobClient } from "@/adapters/client";
import { DataType, DataSchema, PartialDataSchema, PartialData } from "@/schema";
import { describeRoute, resolver, validator } from "hono-openapi";
import { createAuthedHonoRouter } from "@/lib/auth";
import { DataListOrder } from "@/adapters/StorageClientBase";

let router = createAuthedHonoRouter("user");
// Schemas
const IdParamSchema = z.object({ id: z.string().min(1) });

const UpdateDataSchema = PartialDataSchema.partial();

const QueryNameSchema = z.object({ name: z.string().min(1).optional() });

// Create
router = router.post(
    "/data",
    describeRoute({
        summary: "Create a new Data item",
        description: "Creates a new Data item in the database.",
        tags: ["Data"],
        requestBody: {
            content: {
                "application/json": {},
            },
            required: true,
        },
        security: [{ ClerkUser: [] }],
        responses: {
            201: {
                description: "Data item created successfully",
                content: {
                    "application/json": { schema: resolver(DataSchema) },
                },
            },
            400: { description: "Invalid request body" },
            403: { description: "Forbidden" },
        },
    }),
    validator("json", PartialDataSchema),

    //Authorization
    async (c, next) => {
        if (c.get("user").role !== "admin") {
            return c.text("Forbidden!", 403);
        }
        return next();
    },
    async (c) => {
        const user = c.get("user");
        const body = c.req.valid("json");

        const item: PartialData = {
            name: body.name,
            description: body.description,
            author: user.authUid,
            additionalData: body.additionalData,
            downloadCount: 0,
            encrypted: body.encrypted,
            uploadedAt: Date.now(),
        };

        // Validate with canonical DataSchema before persisting
        const validated = PartialDataSchema.parse(item);

        const db = await DataDBClient(c.env);
        return c.json(await db.put(validated), 201);
    }
);

// Read list / query
router = router.get(
    "/data",
    describeRoute({
        summary: "List or query Data items",
        description: "Lists all Data items or queries by name.",
        tags: ["Data"],
        parameters: [
            {
                name: "name",
                in: "query",
                description: "Optional name to filter results",
                required: false,
                schema: { type: "string" },
            },
        ],
    }),
    validator("query", QueryNameSchema),
    async (c) => {
        // validate optional query param 'name'
        const q = c.req.query("name")?.trim();
        const maybe = QueryNameSchema.safeParse({ name: q });
        if (!maybe.success) {
            return c.json({ error: maybe.error.message }, 400);
        }

        const db = await DataDBClient(c.env);
        if (q) {
            const results = await db.queryByName(q);
            // validate each result
            const validated = results.map((r: any) => DataSchema.parse(r));
            return c.json(validated);
        } else {
            const all = await db.list(DataListOrder.Undefined);
            const validatedAll = all.map((r: any) => DataSchema.parse(r));
            return c.json(validatedAll);
        }
    }
);

// Read single
router = router.get(
    "/data/:id",
    describeRoute({
        summary: "Get a single Data item by ID",
        description: "Retrieves a single Data item by its ID.",
        tags: ["Data"],
        parameters: [
            {
                name: "id",
                in: "path",
                description: "The ID of the Data item",
                required: true,
                schema: { type: "string" },
            },
        ],
        responses: {
            200: {
                description: "Successful response",
                content: {
                    "application/json": { schema: resolver(DataSchema) },
                },
            },
            400: { description: "Invalid ID supplied" },
            404: { description: "Data item not found" },
        },
    }),
    async (c) => {
        const id = c.req.param("id");
        const parsed = IdParamSchema.safeParse({ id });
        if (!parsed.success) return c.text("Invalid ID", 400);

        const db = await DataDBClient(c.env);
        const item = await db.get(id);
        if (!item) return c.text("Not Found", 404);

        const validated = DataSchema.parse(item);
        return c.json(validated);
    }
);

// Update
router.patch(
    "/data/:id",
    describeRoute({
        summary: "Update a Data item by ID",
        description: "Updates a Data item by its ID.",
        tags: ["Data"],
        security: [{ ClerkUser: [] }],
        responses: {
            200: {
                description: "Data item updated successfully",
                content: {
                    "application/json": { schema: resolver(DataSchema) },
                },
            },
            400: { description: "Invalid ID or request body" },
            404: { description: "Data item not found" },
            403: { description: "Forbidden" },
        },
    }),
    validator("json", UpdateDataSchema),
    async (c) => {
        const id = c.req.param("id");
        const idOk = IdParamSchema.safeParse({ id });
        if (!idOk.success) return c.json({ error: "invalid id" }, 400);

        const body = c.req.valid("json");
        const db = await DataDBClient(c.env);

        const existing = await db.get(id);
        if (!existing) return c.json({ error: "not found" }, 404);

        const updated: DataType = {
            id: existing.id,
            author: existing.author,
            name: body.name ?? existing.name,
            description: body.description ?? existing.description,
            additionalData: body.additionalData ?? existing.additionalData,
            encrypted: body.encrypted ?? existing.encrypted,
            downloadCount: body.downloadCount ?? existing.downloadCount,
            uploadedAt: Date.now(),
        };

        const validated = DataSchema.parse(updated);
        await db.put(validated);
        return c.json(validated);
    }
);

// Delete
router = router.delete(
    "/data/:id",
    describeRoute({
        summary: "Delete a Data item by ID",
        description: "Deletes a Data item by its ID.",
        tags: ["Data"],
        responses: {
            200: { description: "Data item deleted successfully" },
            400: { description: "Invalid ID" },
            404: { description: "Data item not found" },
            403: { description: "Forbidden" },
        },
        security: [{ ClerkUser: [] }],
    }),
    validator("param", IdParamSchema),
    async (c) => {
        const id = c.req.param("id");
        const idOk = IdParamSchema.safeParse({ id });
        if (!idOk.success) return c.json({ error: "invalid id" }, 400);

        const db = await DataDBClient(c.env);
        const existing = await db.get(id);
        if (!existing) return c.json({ error: "not found" }, 404);

        // validate stored item before acting
        const validated = DataSchema.parse(existing);

        // If additionalData points to a blob URL stored in storage, attempt delete
        const storage = await BlobClient(c.env);
        if (validated.additionalData) {
            try {
                await storage.delete(validated.additionalData);
            } catch (e) {
                // ignore storage delete errors for now
            }
        }

        await db.delete(id);
        return c.json({ ok: true });
    }
);

// Upload blob
// Accepts binary body and returns a blob URL stored in the storage client.
router = router.post(
    "/data/:id/blob",
    describeRoute({
        summary: "Upload a blob for a Data item",
        description:
            "Uploads a binary blob and associates it with the Data item.",
        tags: ["Blob"],
        responses: {
            200: {
                description: "Blob uploaded successfully",
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                url: { type: "string", format: "url" },
                            },
                        },
                    },
                },
            },
            400: { description: "Invalid ID or request" },
            404: { description: "Data item not found" },
            500: { description: "Blob upload failed" },
        },
        security: [{ ClerkUser: [] }],
    }),
    validator("param", IdParamSchema),
    async (c) => {
        const id = c.req.param("id");
        const idOk = IdParamSchema.safeParse({ id });
        if (!idOk.success) return c.json({ error: "invalid id" }, 400);

        const db = await DataDBClient(c.env);
        const existing = await db.get(id);
        if (!existing) return c.json({ error: "not found" }, 404);

        const storage = await BlobClient(c.env);
        const ab = await c.req.arrayBuffer();
        const contentType =
            c.req.header("content-type") ?? "application/octet-stream";
        const url = await storage.upload(ab, contentType);

        // ensure url is valid
        const urlOk = z.url().safeParse(url);
        if (!urlOk.success)
            return c.json({ error: "invalid blob url returned" }, 500);

        existing.additionalData = url;
        const validated = DataSchema.parse(existing);
        await db.put(validated);

        return c.json({ url });
    }
);

export default router;
