// Mock IndexedDB first with fake-indexeddb
import "fake-indexeddb/auto";
// Now, do the rest
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PersonaStore } from "@/features/persona/stores/personaStore.svelte";
import { type Persona } from "@/features/persona/schema";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import { createLocalStorageMock } from "@test/utils/localStorageMock";

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

        // Create a mock adapter that respects what's in localStorage
        const mockLocalStorageAdapter = {
            init: vi.fn().mockResolvedValue(undefined),
            getAllPersonas: vi.fn().mockImplementation(async () => {
                const stored = localStorage.getItem("arisutalk_personas");
                return stored ? JSON.parse(stored) : [];
            }),
            savePersona: vi.fn().mockResolvedValue(undefined),
            updatePersona: vi.fn().mockResolvedValue(undefined),
            deletePersona: vi.fn().mockResolvedValue(undefined),
            getActivePersonaId: vi.fn().mockResolvedValue(null),
            setActivePersonaId: vi.fn().mockResolvedValue(undefined),
        };

        const newStore = new PersonaStore(mockLocalStorageAdapter);
        await newStore.initPromise; // wait for async load
        expect(newStore.personas).toHaveLength(1);
    });

    it("should correctly load state on initialization", () => {
        localStorageMock.setItem("arisutalk_personas", JSON.stringify([validPersona]));
        const newStore = new PersonaStore(mockAdapter);
        expect(newStore.personas).toHaveLength(1);
        expect(newStore.personas[0]).toEqual(validPersona);
    });
});
