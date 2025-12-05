import { describeRoute, validator } from "hono-openapi";
import z from "zod";
import { BlobClient, DataDBClient } from "@/adapters/client";
import { createAuthedHonoRouter } from "@/lib/auth";
import { DataSchema } from "@/schema";

const IdParamSchema = z.object({ id: z.string().min(1) });

const router = createAuthedHonoRouter("known")
    // Upload blob
    // Accepts binary body and returns a blob URL stored in the storage client.
    .post(
        "/data/:id/blob",
        describeRoute({
            summary: "Upload a blob for a Data item",
            description:
                "Uploads a binary blob and associates it with the Data item. It can be used to overwrite existing blobs.",
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

            const validatedItem = DataSchema.parse(existing);
            const user = c.get("user");
            // Only admin or author can upload blob
            if (
                user.role !== "admin" &&
                user.authUid !== validatedItem.author
            ) {
                return c.text("Forbidden", 403);
            }

            const storage = await BlobClient(c.env);
            const ab = await c.req.arrayBuffer();
            const contentType =
                c.req.header("content-type") ?? "application/octet-stream";
            const url = await storage.upload(ab, contentType);

            existing.additionalData = url;
            const validated = DataSchema.parse(existing);
            await db.update({
                id: validated.id,
                additionalData: validated.additionalData,
            });

            return c.json({ url });
        },
    )

    .get(
        "/data/:id/blob",
        describeRoute({
            summary: "Get the blob URL for a Data item",
            description:
                "Retrieves the blob URL associated with the Data item. Increases download count if applicable.",
            tags: ["Blob"],
            responses: {
                307: {
                    description: "Redirect to the blob URL.",
                },
                400: { description: "Invalid ID" },
                404: { description: "ID found, but Blob not found" },
            },
            security: [{ ClerkUser: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "The ID of the Data item",
                    required: true,
                    schema: { type: "string" },
                },
            ],
        }),
        validator("param", IdParamSchema),
        async (c) => {
            const id = c.req.param("id");
            const idOk = IdParamSchema.safeParse({ id });
            if (!idOk.success) return c.json({ error: "invalid id" }, 400);

            const db = await DataDBClient(c.env);
            const storage = await BlobClient(c.env);

            const existing = await db.get(id);
            if (!existing) return c.json({ error: "not found" }, 404);

            const validated = DataSchema.parse(existing);

            if (!validated.additionalData) {
                return c.json({ error: "blob not found" }, 404);
            }
            const url = await storage.get(validated.additionalData);
            if (!url) {
                return c.json({ error: "blob not found" }, 404);
            }

            await db.bumpDownloadCount(id);

            return c.redirect(url, 307);
        },
    );

export default router;
