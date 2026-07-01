/**
 * @fileoverview Tests for the storage migration utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock IndexedDB via Dexie
const mockTables: Record<string, { name: string; toArray: () => Promise<unknown[]>; clear: () => Promise<void>; bulkAdd: () => Promise<void> }> = {};

vi.mock("@/lib/adapters/storage/IndexedDBHelper", () => ({
    getArisuDB: () => ({
        tables: Object.values(mockTables).map((t) => ({
            name: t.name,
            toArray: () => t.toArray(),
            clear: () => t.clear(),
            bulkAdd: (_data: never[]) => t.bulkAdd(),
        })),
        chats: { toArray: () => Promise.resolve([]) },
        characters: { toArray: () => Promise.resolve([]) },
        settings: { toArray: () => Promise.resolve([]) },
        personas: { toArray: () => Promise.resolve([]) },
        messages: { toArray: () => Promise.resolve([]) },
        stickers: { toArray: () => Promise.resolve([]) },
        memories: { toArray: () => Promise.resolve([]) },
    }),
}));

import { exportAllData, importBackup, checkStoredSchemaVersion, markSchemaMigrated } from "@/lib/migration/storageMigration";

describe("storageMigration", () => {
    beforeEach(() => {
        vi.stubGlobal("localStorage", (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] ?? null,
                setItem: (key: string, value: string) => { store[key] = value; },
                removeItem: (key: string) => { delete store[key]; },
                clear: () => { store = {}; },
            };
        })());

        // Reset mock tables
        Object.keys(mockTables).forEach((k) => delete mockTables[k]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("checkStoredSchemaVersion", () => {
        it("should return 0 when no version is stored", () => {
            expect(checkStoredSchemaVersion()).toBe(0);
        });

        it("should return the stored version number", () => {
            localStorage.setItem("arisutalk_schema_version", "3");
            expect(checkStoredSchemaVersion()).toBe(3);
        });
    });

    describe("markSchemaMigrated", () => {
        it("should set the schema version in localStorage", () => {
            markSchemaMigrated();
            expect(localStorage.getItem("arisutalk_schema_version")).toBe("3");
        });
    });

    describe("exportAllData", () => {
        it("should export data from all tables", async () => {
            mockTables["chats"] = {
                name: "chats",
                toArray: () => Promise.resolve([{ id: "chat-1", title: "Test" }]),
                clear: () => Promise.resolve(),
                bulkAdd: () => Promise.resolve(),
            };
            mockTables["characters"] = {
                name: "characters",
                toArray: () => Promise.resolve([]),
                clear: () => Promise.resolve(),
                bulkAdd: () => Promise.resolve(),
            };

            const result = await exportAllData();
            expect(result).toHaveProperty("data");
            expect(result.data).toHaveProperty("chats");
            expect(result.data.chats).toHaveLength(1);
            expect(result.data.chats[0]).toMatchObject({ id: "chat-1", title: "Test" });
        });
    });

    describe("importBackup", () => {
        it("should import data into tables", async () => {
            const cleared: string[] = [];
            const imported: string[] = [];

            mockTables["chats"] = {
                name: "chats",
                toArray: () => Promise.resolve([]),
                clear: () => { cleared.push("chats"); return Promise.resolve(); },
                bulkAdd: () => { imported.push("chats"); return Promise.resolve(); },
            };

            await importBackup({
                data: {
                    chats: [{ id: "chat-1", title: "Restored" }],
                },
            });

            expect(cleared).toContain("chats");
            expect(imported).toContain("chats");
        });
    });
});
