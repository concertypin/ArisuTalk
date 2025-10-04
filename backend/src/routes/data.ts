import { Hono } from "hono";
import { createDBClient } from "../adapters/oracle-nosql";
import { createStorageClient } from "../adapters/s3-storage";
import { Data, PartialData } from "../types";

const router = new Hono();

// Create helpers to obtain clients from bindings if available
function getDB(c: any) {
  // expected binding name: ORACLE_DB
  return createDBClient((c.env && c.env.ORACLE_DB) || undefined);
}

function getStorage(c: any) {
  // expected binding name: S3
  return createStorageClient((c.env && c.env.S3) || undefined);
}

// Create
router.post("/data", async (c) => {
  const body = await c.req.json<PartialData>();
  if (!body.name || !body.author) {
    return c.json({ error: "name and author are required" }, 400);
  }

  const id = body.id ?? crypto.randomUUID();
  const db = getDB(c);

  const item: Data = {
    id,
    name: body.name!,
    description: body.description ?? "",
    author: body.author!,
    additionalData: body.additionalData ?? "",
  };

  await db.put(item);
  return c.json(item, 201);
});

// Read list / query
router.get("/data", async (c) => {
  const q = c.req.query("name");
  const db = getDB(c);
  if (q) {
    const results = await db.queryByName(q);
    return c.json(results);
  }

  const all = await db.list();
  return c.json(all);
});

// Read single
router.get("/data/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDB(c);
  const item = await db.get(id);
  if (!item) return c.json({ error: "not found" }, 404);
  return c.json(item);
});

// Update
router.put("/data/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<PartialData>();
  const db = getDB(c);

  const existing = await db.get(id);
  if (!existing) return c.json({ error: "not found" }, 404);

  const updated: Data = {
    ...existing,
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    author: body.author ?? existing.author,
    additionalData: body.additionalData ?? existing.additionalData,
  };

  await db.put(updated);
  return c.json(updated);
});

// Delete
router.delete("/data/:id", async (c) => {
  const id = c.req.param("id");
  const db = getDB(c);
  const existing = await db.get(id);
  if (!existing) return c.json({ error: "not found" }, 404);

  // If additionalData points to a blob URL stored in storage, attempt delete
  const storage = getStorage(c);
  if (existing.additionalData) {
    try {
      await storage.delete(existing.additionalData);
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
  const db = getDB(c);
  const existing = await db.get(id);
  if (!existing) return c.json({ error: "not found" }, 404);

  const storage = getStorage(c);
  const ab = await c.req.arrayBuffer();
  const contentType =
    c.req.header("content-type") ?? "application/octet-stream";
  const url = await storage.upload(ab, contentType);

  existing.additionalData = url;
  await db.put(existing);

  return c.json({ url });
});

export default router;
