# ArisuTalk Backend — Simple CRUD API

This folder contains a small Hono-based CRUD API for Data items.

Data shape:

type Data = { id: string, name: string, description: string, author: string, additionalData: BLOBUrl }

Features:

- In-memory fallback for Oracle NoSQL and S3-like storage for local development
- CRUD endpoints under `/api`

Endpoints:

- POST /api/data — create item
- GET /api/data — list all (optional `?name=` to query by name)
- GET /api/data/:id — read item
- PUT /api/data/:id — update item
- DELETE /api/data/:id — delete item (also attempts to delete blob)
- POST /api/data/:id/blob — upload blob for an item (binary body)

Local dev:
You can run the app using a node server (requires Node and dependencies installed).

# ArisuTalk Backend

This is the backend component of the ArisuTalk AI chat application.

```txt
pnpm install
pnpm run dev
```

```txt
pnpm run deploy
```
