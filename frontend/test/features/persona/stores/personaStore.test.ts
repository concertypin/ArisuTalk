// Mock IndexedDB first with fake-indexeddb
import "fake-indexeddb/auto";
// Now, do the rest
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PersonaStore } from "@/features/persona/stores/personaStore.svelte";
import { PersonaSchema, type Persona } from "@/features/persona/schema";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import { createLocalStorageMock } from "@test/utils/localStorageMock";
import { apply } from "@arisutalk/character-spec/utils";

describe("PersonaStore", () => {
    let store: PersonaStore;
    let mockAdapter: IPersonaStorageAdapter;
    let localStorageMock: Storage;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock(vi);
        vi.stubGlobal("localStorage", localStorageMock);

        // Create mock adapter
        mockAdapter = {
            init: vi.fn().mockResolvedValue(undefined),
            getAllPersonas: vi.fn().mockResolvedValue([]),
            savePersona: vi.fn().mockResolvedValue(undefined),
            updatePersona: vi.fn().mockResolvedValue(undefined),
            deletePersona: vi.fn().mockResolvedValue(undefined),
            getActivePersonaId: vi.fn().mockResolvedValue(null),
            setActivePersonaId: vi.fn().mockResolvedValue(undefined),
        };

        store = new PersonaStore(mockAdapter);
    });

    const validPersona: Persona = apply(PersonaSchema, {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Persona",
        description: "A test description",
    });

    it("should initialize with empty state", () => {
        expect(store.personas).toEqual([]);
        expect(store.activePersonaId).toBeNull();
    });

    it("should add a valid persona", () => {
        store.add(validPersona);
        expect(store.personas).toHaveLength(1);
        expect(store.personas[0]).toEqual(validPersona);
        expect(mockAdapter.savePersona).toHaveBeenCalledWith(validPersona);
    });

    it("should throw error when adding invalid persona", () => {
        const invalidPersona = { ...validPersona, name: "" }; // Name required
        expect(() => store.add(invalidPersona)).toThrow();
        expect(store.personas).toHaveLength(0);
    });

    it("should update a persona", () => {
        store.add(validPersona);
        const updated = { ...validPersona, name: "Updated Name" };
        store.update(validPersona.id, updated);
        expect(store.personas[0].name).toBe("Updated Name");
    });

    it("should remove a persona", () => {
        store.add(validPersona);
        store.remove(validPersona.id);
        expect(store.personas).toHaveLength(0);
    });

    it("should select a persona", () => {
        store.add(validPersona);
        store.select(validPersona.id);
        expect(store.activePersonaId).toBe(validPersona.id);
        expect(store.activePersona).toEqual(validPersona);
    });

    it("should handle null selection", () => {
        store.add(validPersona);
        store.select(validPersona.id);
        store.select(null);
        expect(store.activePersonaId).toBeNull();
        expect(store.activePersona).toBeNull();
    });

    it("should handle update for non-existent persona", () => {
        const updated = { ...validPersona, name: "Non-existent" };
        store.update("wrong-id", updated);
        expect(store.personas).toHaveLength(0);
    });

    it("should handle remove for non-existent persona", () => {
        store.add(validPersona);
        store.remove("wrong-id");
        expect(store.personas).toHaveLength(1);
    });

    it("should return null for activePersona when no persona is selected", () => {
        expect(store.activePersona).toBeNull();
    });

    it("should throw error when loading corrupted state", () => {
        localStorageMock.setItem("arisutalk_personas", "invalid json");
        const newStore = new PersonaStore(mockAdapter);
        expect(newStore.personas).toEqual([]);
    });

    it("should correctly load state on initialization", () => {
        localStorageMock.setItem("arisutalk_personas", JSON.stringify([validPersona]));
        const newStore = new PersonaStore(mockAdapter);
        expect(newStore.personas).toHaveLength(1);
        expect(newStore.personas[0]).toEqual(validPersona);
    });

    it("should load active persona from localStorage", () => {
        localStorageMock.setItem("arisutalk_personas", JSON.stringify([validPersona]));
        localStorageMock.setItem("arisutalk_active_persona", validPersona.id);
        const newStore = new PersonaStore(mockAdapter);
        expect(newStore.activePersonaId).toBe(validPersona.id);
        expect(newStore.activePersona).toEqual(validPersona);
    });

    it("should handle invalid persona JSON in localStorage", () => {
        localStorageMock.setItem("arisutalk_personas", "{invalid}");
        const newStore = new PersonaStore(mockAdapter);
        expect(newStore.personas).toEqual([]);
    });

    it("should clear activePersonaId when removing selected persona", () => {
        store.add(validPersona);
        store.select(validPersona.id);
        expect(store.activePersonaId).toBe(validPersona.id);

        store.remove(validPersona.id);
        expect(store.activePersonaId).toBeNull();
        expect(store.personas).toHaveLength(0);
    });

    it("should reorder personas by moving from one index to another", () => {
        const personaA = apply(PersonaSchema, { ...validPersona, id: "id-a", name: "A" });
        const personaB = apply(PersonaSchema, { ...validPersona, id: "id-b", name: "B" });
        const personaC = apply(PersonaSchema, { ...validPersona, id: "id-c", name: "C" });

        store.add(personaA);
        store.add(personaB);
        store.add(personaC);
        expect(store.personas.map((p) => p.name)).toEqual(["A", "B", "C"]);

        // Move A (index 0) to position 2 => [B, C, A]
        store.reorder(0, 2);
        expect(store.personas.map((p) => p.name)).toEqual(["B", "C", "A"]);

        // Move C (index 1) to position 0 => [C, B, A]
        store.reorder(1, 0);
        expect(store.personas.map((p) => p.name)).toEqual(["C", "B", "A"]);
    });

    it("should not reorder with invalid indices", () => {
        const personaA = apply(PersonaSchema, { ...validPersona, id: "id-a", name: "A" });
        const personaB = apply(PersonaSchema, { ...validPersona, id: "id-b", name: "B" });

        store.add(personaA);
        store.add(personaB);

        // Out of bounds - should be no-op
        store.reorder(-1, 1);
        expect(store.personas.map((p) => p.name)).toEqual(["A", "B"]);

        store.reorder(0, 5);
        expect(store.personas.map((p) => p.name)).toEqual(["A", "B"]);

        store.reorder(5, 0);
        expect(store.personas.map((p) => p.name)).toEqual(["A", "B"]);
    });

    it("should save persona order to localStorage on reorder", () => {
        const personaA = apply(PersonaSchema, { ...validPersona, id: "id-a", name: "A" });
        const personaB = apply(PersonaSchema, { ...validPersona, id: "id-b", name: "B" });

        store.add(personaA);
        store.add(personaB);

        store.reorder(1, 0);
        const order = JSON.parse(localStorageMock.getItem("arisutalk_persona_order")!);
        expect(order).toEqual(["id-b", "id-a"]);
    });

    it("should restore order from localStorage on load", async () => {
        const personaA = apply(PersonaSchema, { ...validPersona, id: "id-a", name: "A" });
        const personaB = apply(PersonaSchema, { ...validPersona, id: "id-b", name: "B" });

        // Mock adapter to return the personas (load() uses adapter.getAllPersonas)
        vi.mocked(mockAdapter.getAllPersonas).mockResolvedValue([personaA, personaB]);
        localStorageMock.setItem("arisutalk_persona_order", JSON.stringify(["id-b", "id-a"]));

        const newStore = new PersonaStore(mockAdapter);
        // Wait for async init to complete
        await newStore.initPromise;

        expect(newStore.personas.map((p) => p.name)).toEqual(["B", "A"]);
    });
});
