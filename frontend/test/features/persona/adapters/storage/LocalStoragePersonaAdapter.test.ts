import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStoragePersonaAdapter } from "@/features/persona/adapters/storage/LocalStoragePersonaAdapter";
import type { Persona } from "@/features/persona/schema";

// Note: The previous test file was importing from lib/adapters/storage/persona/LocalStoragePersonaAdapter
// which might be an alias or duplicate file.
// The coverage report pointed to src/features/persona/adapters/storage/LocalStoragePersonaAdapter.ts (or similar path in src/features)
// having 0% coverage if it wasn't being tested.
// But actually, the file I read was: frontend/src/features/persona/adapters/storage/LocalStoragePersonaAdapter.ts
// And I am now creating/overwriting tests for IT.

describe("LocalStoragePersonaAdapter (Feature)", () => {
    let adapter: LocalStoragePersonaAdapter;
    const testPersona: Persona = {
        id: "persona-1",
        name: "Test Persona",
        description: "A test persona",
        profileAsset: "avatar.png",
        assets: { assets: [] },
    };

    beforeEach(() => {
        localStorage.clear();
        adapter = new LocalStoragePersonaAdapter();
        vi.clearAllMocks();
    });

    it("should initialize", async () => {
        await expect(adapter.init()).resolves.toBeUndefined();
    });

    it("should save and retrieve personas", async () => {
        await adapter.savePersona(testPersona);
        const all = await adapter.getAllPersonas();
        expect(all).toHaveLength(1);
        expect(all[0]).toEqual(testPersona);
    });

    it("should update persona", async () => {
        await adapter.savePersona(testPersona);
        const updated = { ...testPersona, name: "Updated Name" };
        await adapter.updatePersona(testPersona.id, updated);

        const all = await adapter.getAllPersonas();
        expect(all[0].name).toBe("Updated Name");
    });

    it("should delete persona", async () => {
        await adapter.savePersona(testPersona);
        await adapter.deletePersona(testPersona.id);
        const all = await adapter.getAllPersonas();
        expect(all).toHaveLength(0);
    });

    it("should manage active persona id", async () => {
        expect(await adapter.getActivePersonaId()).toBeNull();

        await adapter.setActivePersonaId("persona-1");
        expect(await adapter.getActivePersonaId()).toBe("persona-1");

        await adapter.setActivePersonaId(null);
        expect(await adapter.getActivePersonaId()).toBeNull();
    });

    it("should handle corrupted data", async () => {
        localStorage.setItem("arisutalk_personas", "invalid json");
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const all = await adapter.getAllPersonas();
        expect(all).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it("clears active persona if deleted", async () => {
        await adapter.savePersona(testPersona);
        await adapter.setActivePersonaId(testPersona.id);
        expect(await adapter.getActivePersonaId()).toBe(testPersona.id);

        await adapter.deletePersona(testPersona.id);
        expect(await adapter.getActivePersonaId()).toBeNull();
    });
});
