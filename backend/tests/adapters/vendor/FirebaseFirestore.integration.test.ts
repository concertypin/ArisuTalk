import { beforeAll, describe, expect, it } from "vitest";
import type { DBEnv } from "@/adapters/client";
import FirebaseFirestoreClient from "@/adapters/vendor/FirebaseFirestore";

// Define the shape of the standard Firebase service account JSON
interface FirebaseServiceAccount {
    project_id: string;
    client_email: string;
    private_key: string;
}

describe.runIf(async () => {
    const secretModule = await import("../../../secret.json", {
        with: { type: "json" },
    });

    const secret = (secretModule.default ||
        secretModule) satisfies FirebaseServiceAccount;

    if (!secret.project_id || !secret.client_email || !secret.private_key)
        return false;
    return true;
})("FirebaseFirestoreClient Integration (REAL)", () => {
    let client: FirebaseFirestoreClient;

    beforeAll(async (ctx) => {
        // Add 'this' parameter for access to Vitest context
        try {
            // Already validated in describe.runIf
            const secret: FirebaseServiceAccount = await import(
                "../../../secret.json",
                {
                    with: { type: "json" },
                }
            );
            const env: DBEnv = {
                SECRET_FIREBASE_PROJECT_ID: secret.project_id,
                SECRET_FIREBASE_CLIENT_EMAIL: secret.client_email,
                SECRET_FIREBASE_PRIVATE_KEY: secret.private_key,
                SECRET_CLERK_SECRET_KEY: "dummy",
                ENV_CLERK_PUBLIC_KEY: "dummy",
            };

            client = new FirebaseFirestoreClient(env);
        } catch (error) {
            console.warn(
                "Skipping integration tests: secret.json not found or failed to load.",
                error,
            );
            ctx;
        }
    });

    it("should list documents (real connection)", async () => {
        const docs = await client.list(); // Use non-null assertion as we've skipped if client is null
        console.log(`Found ${docs.items.length} documents.`);
        expect(Array.isArray(docs.items)).toBe(true);
    });

    it("should write, update, read, and delete a document (real connection)", async () => {
        const newItem = {
            name: `Integration Test Item ${Date.now()}`,
            author: "tester",
            downloadCount: 0,
            encrypted: false,
            additionalData: "test-data",
        };

        // 1. Create
        const created = await client.put(newItem); // Use non-null assertion
        expect(created.id).toBeDefined();
        expect(created.name).toBe(newItem.name);
        console.log("Created document:", created.id);

        // 2. Update
        const updatePayload = { id: created.id, downloadCount: 100 };
        const updated = await client.update(updatePayload); // Use non-null assertion
        expect(updated.downloadCount).toBe(100);
        console.log("Updated document:", updated.id);

        // 3. Get (Verify)
        const fetched = await client.get(created.id); // Use non-null assertion
        expect(fetched).toBeDefined();
        expect(fetched?.downloadCount).toBe(100);

        // 4. Delete
        await client.delete(created.id); // Use non-null assertion
        console.log("Deleted document:", created.id);

        // 5. Verify Deletion
        const deleted = await client.get(created.id); // Use non-null assertion
        expect(deleted).toBeNull();
    });
});
