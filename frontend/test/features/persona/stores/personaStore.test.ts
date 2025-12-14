import { describe, it, expect, beforeEach, vi } from "vitest";
import { PersonaStore } from "@/features/persona/stores/personaStore.svelte";
import type { Persona } from "@/features/persona/schema";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";

describe("PersonaStore", () => {
    let store: PersonaStore;
    let mockAdapter: IPersonaStorageAdapter;

    // Mock localStorage for sync loading
    const localStorageMock = (() => {
        let store: Record<string, string> = {};
        return {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                store[key] = value.toString();
            }),
            removeItem: vi.fn((key: string) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            }),
        };
    })();

    beforeEach(() => {
        vi.stubGlobal("localStorage", localStorageMock);
        localStorageMock.clear();

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

    const validPersona: Persona = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test User",
        description: "A test description",
        note: "Secret note",
        assets: { assets: [] },
    };

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

    it("should load from localStorage", async () => {
        localStorageMock.setItem("arisutalk_personas", JSON.stringify([validPersona]));
        const newStore = new PersonaStore();
        await newStore.initPromise; // wait for async load
        expect(newStore.personas).toHaveLength(1);
    });

    it("should correctly load state on initialization", () => {
        localStorageMock.setItem("arisutalk_personas", JSON.stringify([validPersona]));
        const newStore = new PersonaStore();
        expect(newStore.personas).toHaveLength(1);
        expect(newStore.personas[0]).toEqual(validPersona);
    });
});
