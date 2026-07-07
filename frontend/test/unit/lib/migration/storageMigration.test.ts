/**
 * @fileoverview Tests for the storage migration utilities.
 * Core logic tests only — CBOR format tests require browser environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/adapters/storage/IndexedDBHelper", () => ({
    getArisuDB: () => ({
        tables: [],
        chats: { toArray: () => Promise.resolve([]) },
        characters: { toArray: () => Promise.resolve([]) },
        settings: { toArray: () => Promise.resolve([]) },
        personas: { toArray: () => Promise.resolve([]) },
        messages: { toArray: () => Promise.resolve([]) },
        stickers: { toArray: () => Promise.resolve([]) },
        memories: { toArray: () => Promise.resolve([]) },
    }),
}));

import { checkStoredSchemaVersion, markSchemaMigrated } from "@/lib/migration/storageMigration";

describe.concurrent("storageMigration", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "localStorage",
            (() => {
                const store: Record<string, string> = {};
                return {
                    getItem: (key: string) => store[key] ?? null,
                    setItem: (key: string, value: string) => void (store[key] = value),
                    removeItem: (key: string) => void delete store[key],
                    clear: () => {
                        for (const k of Object.keys(store)) delete store[k];
                    },
                };
            })()
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe.concurrent("checkStoredSchemaVersion", () => {
        it("should return 0 when no version is stored", () => {
            expect(checkStoredSchemaVersion()).toBe(0);
        });
        it("should return the stored version number", () => {
            localStorage.setItem("arisutalk_schema_version", "3");
            expect(checkStoredSchemaVersion()).toBe(3);
        });
    });

    describe.concurrent("markSchemaMigrated", () => {
        it("should set the schema version in localStorage", () => {
            markSchemaMigrated();
            expect(localStorage.getItem("arisutalk_schema_version")).toBe("3");
        });
    });
});
