import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStoragePersonaAdapter } from "@/lib/adapters/storage/persona/LocalStoragePersonaAdapter";
import type { Persona } from "@/features/persona/schema";

describe("LocalStoragePersonaAdapter", () => {
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
        const all = await adapter.getAllPersonas();
        expect(all).toEqual([]);
    });
});
