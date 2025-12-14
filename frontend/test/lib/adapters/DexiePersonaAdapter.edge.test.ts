import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexiePersonaAdapter } from "@/lib/adapters/storage/persona/IDBPersonaAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { Persona } from "@/features/persona/schema";

describe("DexiePersonaAdapter (edge)", () => {
    let adapter: DexiePersonaAdapter;
    const db = getArisuDB();

    beforeEach(async () => {
        await db.delete();
        adapter = new DexiePersonaAdapter();
        await adapter.init();
    });

    it("getAllPersonas returns empty array when DB empty", async () => {
        const all = await adapter.getAllPersonas();
        expect(Array.isArray(all)).toBe(true);
        expect(all.length).toBe(0);
    });

    it("deleting active persona keeps active id (adapter does not clear it)", async () => {
        const p1: Persona = { id: "p-1", name: "One", description: "First" };
        const p2: Persona = { id: "p-2", name: "Two", description: "Second" };
        await adapter.savePersona(p1);
        await adapter.savePersona(p2);
        await adapter.setActivePersonaId(p1.id);
        const active = await adapter.getActivePersonaId();
        expect(active).toBe(p1.id);
        // delete active
        await adapter.deletePersona(p1.id);
        const after = await adapter.getActivePersonaId();
        // Current adapter implementation does not auto-clear the active id on persona deletion.
        // Assert current behavior: active id remains (caller is responsible for clearing it).
        expect(after).toBe(p1.id);
    });
});
