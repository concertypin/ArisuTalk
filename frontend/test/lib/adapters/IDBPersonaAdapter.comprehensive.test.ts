import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { DexiePersonaAdapter } from "@/lib/adapters/storage/persona/IDBPersonaAdapter";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { Persona } from "@/features/persona/schema";

describe("DexiePersonaAdapter (comprehensive)", () => {
    let adapter: DexiePersonaAdapter;
    const db = getArisuDB();

    const testPersona: Persona = {
        id: "persona-1",
        name: "Test Persona",
        description: "A test persona for unit tests",
        assets: { assets: [] },
    };

    beforeEach(async () => {
        await db.personas.clear();
        await db.settings.clear();
        adapter = new DexiePersonaAdapter();
        await adapter.init();
    });

    describe("Persona CRUD", () => {
        it("saves and retrieves a persona", async () => {
            await adapter.savePersona(testPersona);
            const all = await adapter.getAllPersonas();
            expect(all.length).toBe(1);
            expect(all[0].name).toBe("Test Persona");
        });

        it("updates an existing persona", async () => {
            await adapter.savePersona(testPersona);
            await adapter.updatePersona("persona-1", { ...testPersona, name: "Updated" });
            const all = await adapter.getAllPersonas();
            expect(all[0].name).toBe("Updated");
        });

        it("deletes a persona", async () => {
            await adapter.savePersona(testPersona);
            await adapter.deletePersona("persona-1");
            const all = await adapter.getAllPersonas();
            expect(all.length).toBe(0);
        });

        it("handles multiple personas", async () => {
            await adapter.savePersona({ ...testPersona, id: "p1", name: "A" });
            await adapter.savePersona({ ...testPersona, id: "p2", name: "B" });
            await adapter.savePersona({ ...testPersona, id: "p3", name: "C" });
            const all = await adapter.getAllPersonas();
            expect(all.length).toBe(3);
        });
    });

    describe("Active persona", () => {
        it("returns null when no active persona set", async () => {
            const id = await adapter.getActivePersonaId();
            expect(id).toBeNull();
        });

        it("sets and gets active persona", async () => {
            await adapter.setActivePersonaId("persona-1");
            const id = await adapter.getActivePersonaId();
            expect(id).toBe("persona-1");
        });

        it("clears active persona when set to null", async () => {
            await adapter.setActivePersonaId("persona-1");
            await adapter.setActivePersonaId(null);
            const id = await adapter.getActivePersonaId();
            expect(id).toBeNull();
        });

        it("persists active persona across adapter instances", async () => {
            await adapter.setActivePersonaId("persona-1");
            const newAdapter = new DexiePersonaAdapter();
            await newAdapter.init();
            const id = await newAdapter.getActivePersonaId();
            expect(id).toBe("persona-1");
        });
    });

    describe("Edge cases", () => {
        it("handles persona with special characters in name", async () => {
            const special = { ...testPersona, name: "Test 🎭 Persona <script>" };
            await adapter.savePersona(special);
            const all = await adapter.getAllPersonas();
            expect(all[0].name).toBe("Test 🎭 Persona <script>");
        });

        it("handles empty assets array", async () => {
            await adapter.savePersona(testPersona);
            const all = await adapter.getAllPersonas();
            expect(all[0].assets?.assets?.length).not.toBeGreaterThan(0);
        });

        it("overwrites persona with same id", async () => {
            await adapter.savePersona(testPersona);
            await adapter.savePersona({ ...testPersona, name: "Replaced" });
            const all = await adapter.getAllPersonas();
            expect(all.length).toBe(1);
            expect(all[0].name).toBe("Replaced");
        });
    });
});
