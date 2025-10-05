import z from "zod";
import { DataDBClient, BlobClient } from "../adapters/client";
import { DataType, DataSchema, PartialDataSchema } from "../schema";
import { describeRoute, validator } from "hono-openapi";
import { createAuthedHonoRouter } from "../lib/auth";

let router = createAuthedHonoRouter();
// Schemas
const IdParamSchema = z.object({ id: z.string().min(1) });

const UpdateDataSchema = PartialDataSchema.partial();

const QueryNameSchema = z.object({ name: z.string().min(1).optional() });

// Create
router.post(
    "/data",
    describeRoute({
        summary: "Create a new Data item",
        description: "Creates a new Data item in the database.",
        tags: ["Data"],
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
        const id = crypto.randomUUID();

        const item: DataType = {
            id,
            name: body.name,
            description: body.description,
            author: user.authUid,
            additionalData: body.additionalData,
            downloadCount: 0,
            encrypted: body.encrypted,
        };

        // Validate with canonical DataSchema before persisting
        const validated = DataSchema.parse(item);

        const db = await DataDBClient();
        await db.put(validated);
        return c.json(validated, 201);
    }
);

// Read list / query
router.get(
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
        const q = c.req.query("name");
        const maybe = QueryNameSchema.safeParse({ name: q });
        if (!maybe.success) {
            return c.json({ error: maybe.error.message }, 400);
        }

        const db = await DataDBClient();
        if (q) {
            const results = await db.queryByName(q);
            // validate each result
            const validated = results.map((r: any) => DataSchema.parse(r));
            return c.json(validated);
        }

        const all = await db.list();
        const validatedAll = all.map((r: any) => DataSchema.parse(r));
        return c.json(validatedAll);
    }
);

// Read single
router.get("/data/:id", async (c) => {
    const id = c.req.param("id");
    const parsed = IdParamSchema.safeParse({ id });
    if (!parsed.success) return c.json({ error: "invalid id" }, 400);

    const db = await DataDBClient();
    const item = await db.get(id);
    if (!item) return c.json({ error: "not found" }, 404);

    const validated = DataSchema.parse(item);
    return c.json(validated);
});

// Update
router.put("/data/:id", validator("json", UpdateDataSchema), async (c) => {
    const id = c.req.param("id");
    const idOk = IdParamSchema.safeParse({ id });
    if (!idOk.success) return c.json({ error: "invalid id" }, 400);

    const body = c.req.valid("json");
    const db = await DataDBClient();

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
    };

    const validated = DataSchema.parse(updated);
    await db.put(validated);
    return c.json(validated);
});

// Delete
router.delete("/data/:id", async (c) => {
    const id = c.req.param("id");
    const idOk = IdParamSchema.safeParse({ id });
    if (!idOk.success) return c.json({ error: "invalid id" }, 400);

    const db = await DataDBClient();
    const existing = await db.get(id);
    if (!existing) return c.json({ error: "not found" }, 404);

    // validate stored item before acting
    const validated = DataSchema.parse(existing);

    // If additionalData points to a blob URL stored in storage, attempt delete
    const storage = await BlobClient();
    if (validated.additionalData) {
        try {
            await storage.delete(validated.additionalData);
        } catch (e) {
            // ignore storage delete errors for now
        }
    }

    await db.delete(id);
    return c.json({ ok: true });
});

// Upload blob
// Accepts binary body and returns a blob URL stored in the storage client.
router.post("/data/:id/blob", async (c) => {
    const id = c.req.param("id");
    const idOk = IdParamSchema.safeParse({ id });
    if (!idOk.success) return c.json({ error: "invalid id" }, 400);

    const db = await DataDBClient();
    const existing = await db.get(id);
    if (!existing) return c.json({ error: "not found" }, 404);

    const storage = await BlobClient();
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
});

export default router;
