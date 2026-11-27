/**
 * Backup/restore tests against a real (fake-indexeddb) Dexie database and the real cbor-x codec.
 * Data is seeded into the tables, serialized, wiped and restored, then compared with the seed.
 */
import "fake-indexeddb/auto";
import { assert, describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encode } from "cbor-x";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import {
    BACKUP_EXT,
    checkStoredSchemaVersion,
    exportAllData,
    exportDataAsBlob,
    importBackup,
    markSchemaMigrated,
    parseBackupFile,
} from "@/lib/migration/storageMigration";
import { exampleCharacter, exampleChatData, exampleMessageData } from "@/const/example_data";
import { SettingsSchema } from "@/lib/types/IDataModel";
import type { MemoryEntry } from "@/lib/types/memory";
import type { Persona } from "@/features/persona/schema";
import { createLocalStorageMock } from "@test/utils/localStorageMock";
import { cloneDeep } from "lodash-es";

const SCHEMA_VERSION_KEY = "arisutalk_schema_version";
const TABLE_NAMES = [
    "chats",
    "characters",
    "settings",
    "personas",
    "messages",
    "stickers",
    "memories",
].sort();

const db = getArisuDB();

function makeCharacterWithBinaryAsset() {
    const character = cloneDeep(exampleCharacter);
    character.assets.assets.push({
        id: "asset-bin",
        name: "blob.bin",
        mimeType: "application/octet-stream",
        data: new Uint8Array([0, 1, 2, 253, 254, 255]),
    });
    return character;
}

const persona: Persona = { id: "persona-1", name: "Arisu", description: "Test persona" };
const memory: MemoryEntry = {
    id: "mem-1",
    characterId: exampleCharacter.id,
    content: "Likes tea",
    type: "fact",
    timestamp: "2025-01-01T00:00:00.000Z",
    importance: 0.8,
    lastAccessed: "2025-01-02T00:00:00.000Z",
};

/** Fills the chats/characters/messages/personas/settings/memories tables with non-empty data. */
async function seedDatabase() {
    await db.chats.put(cloneDeep(exampleChatData));
    await db.characters.put(makeCharacterWithBinaryAsset());
    await db.messages.bulkPut(cloneDeep(exampleMessageData));
    await db.personas.put(persona);
    await db.settings.put({ ...SettingsSchema.parse({ theme: "dark" }), id: "main" });
    await db.memories.put(memory);
}

async function readAllTables() {
    return {
        chats: await db.chats.toArray(),
        characters: await db.characters.toArray(),
        messages: (await db.messages.toArray()).sort((a, b) => a.id.localeCompare(b.id)),
        personas: await db.personas.toArray(),
        settings: await db.settings.toArray(),
        memories: await db.memories.toArray(),
        stickers: await db.stickers.toArray(),
    };
}

function backupFile(content: string | Blob | Uint8Array, name = "test.aribackup"): File {
    // A Node `Buffer` may be backed by a SharedArrayBuffer, which `File` does not accept.
    return new File([content instanceof Uint8Array ? new Uint8Array(content) : content], name);
}

/** The schema version the module writes, discovered through its public API. */
function currentSchemaVersion(): number {
    markSchemaMigrated();
    const version = checkStoredSchemaVersion();
    localStorage.removeItem(SCHEMA_VERSION_KEY);
    return version;
}

describe("storageMigration", () => {
    let logs: AnyLogEntry[];
    let detach: () => void;

    beforeEach(async () => {
        await db.delete();
        await db.open();
        vi.stubGlobal("localStorage", createLocalStorageMock(vi));
        logs = [];
        detach = Logger.onLog((entry) => logs.push(entry));
    });

    afterEach(() => {
        detach();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    const loggedMessages = (level: AnyLogEntry["level"]) =>
        logs.filter((entry) => entry.level === level).map((entry) => entry.message);

    describe("schema version marker", () => {
        it("reports 0 before any migration was recorded", () => {
            expect(checkStoredSchemaVersion()).toBe(0);
        });

        it("markSchemaMigrated stores a version that checkStoredSchemaVersion reads back", () => {
            markSchemaMigrated();

            const stored = Number(localStorage.getItem(SCHEMA_VERSION_KEY));
            expect(stored).toBeGreaterThan(0);
            expect(checkStoredSchemaVersion()).toBe(stored);
            expect(logs).toContainEqual(
                expect.objectContaining({
                    level: "migration.schemaVersion",
                    data: { version: stored },
                })
            );
        });

        it("reads an older stored version as is, so callers can detect that a migration is due", () => {
            localStorage.setItem(SCHEMA_VERSION_KEY, "1");

            expect(checkStoredSchemaVersion()).toBe(1);
            expect(checkStoredSchemaVersion()).toBeLessThan(currentSchemaVersion());
        });

        it("falls back to 0 when localStorage throws", () => {
            const storage = createLocalStorageMock(vi);
            vi.mocked(storage.getItem).mockImplementation(() => {
                throw new Error("SecurityError");
            });
            vi.stubGlobal("localStorage", storage);

            expect(checkStoredSchemaVersion()).toBe(0);
        });

        it("assumes the current version and writes nothing when there is no localStorage", () => {
            const current = currentSchemaVersion();
            const storage = createLocalStorageMock(vi);
            vi.stubGlobal("localStorage", undefined);

            expect(checkStoredSchemaVersion()).toBe(current);
            expect(() => markSchemaMigrated()).not.toThrow();
            expect(storage.length).toBe(0);
        });
    });

    describe("exportAllData", () => {
        it("exports every table with its rows and backup metadata", async () => {
            await seedDatabase();

            const exported = await exportAllData();

            expect(Object.keys(exported.data).sort()).toEqual(TABLE_NAMES);
            expect(exported.data.chats).toEqual([exampleChatData]);
            expect(exported.data.personas).toEqual([persona]);
            expect(exported.data.memories).toEqual([memory]);
            expect(exported.data.messages).toHaveLength(exampleMessageData.length);
            expect(exported.data.stickers).toEqual([]);
            expect(exported._schemaVersion).toBe(currentSchemaVersion());
            expect(exported._appVersion).toBe("ArisuTalk Kei");
            expect(new Date(exported._exportedAt).toISOString()).toBe(exported._exportedAt);
        });

        it("exports an empty array for a table that cannot be read and still exports the rest", async () => {
            await seedDatabase();
            const chatsTable = db.tables.find((table) => table.name === "chats");
            expect(chatsTable).toBeDefined();
            vi.spyOn(chatsTable!, "toArray").mockRejectedValue(new Error("read failed"));

            const exported = await exportAllData();

            expect(exported.data.chats).toEqual([]);
            expect(exported.data.personas).toEqual([persona]);
            expect(loggedMessages("warn")).toContain('[Migration] Failed to export table "chats"');
        });
    });

    describe("export -> parse -> import round trip", () => {
        it("restores every table, including binary asset bytes, after the database was wiped", async () => {
            await seedDatabase();
            const before = await readAllTables();
            expect(before.messages.length).toBeGreaterThan(0);

            const blob = await exportDataAsBlob();
            await db.delete();
            await db.open();
            expect((await readAllTables()).chats).toEqual([]);

            const parsed = await parseBackupFile(backupFile(blob));
            await importBackup(parsed);

            const after = await readAllTables();
            expect(after).toEqual(before);
            const restored = after.characters[0].assets.assets.find((a) => a.id === "asset-bin");
            assert(restored?.data instanceof Uint8Array);
            expect(Array.from(restored.data)).toEqual([0, 1, 2, 253, 254, 255]);
        });

        it("exports a binary blob and names backups with the .aribackup extension", async () => {
            await seedDatabase();

            const blob = await exportDataAsBlob();

            expect(blob.type).toBe("application/octet-stream");
            expect(BACKUP_EXT).toBe(".aribackup");
        });

        it("still restores a legacy JSON backup", async () => {
            await seedDatabase();
            const before = await readAllTables();
            const legacy = backupFile(JSON.stringify(await exportAllData()), "old.json");
            await db.delete();
            await db.open();

            await importBackup(await parseBackupFile(legacy));

            const after = await readAllTables();
            // JSON turns Uint8Array into an object, so compare the tables that are plain JSON.
            expect(after.chats).toEqual(before.chats);
            expect(after.messages).toEqual(before.messages);
            expect(after.personas).toEqual(before.personas);
            expect(after.memories).toEqual(before.memories);
            expect(logs).toContainEqual(
                expect.objectContaining({
                    level: "migration.importFormat",
                    data: { format: "json" },
                })
            );
        });
    });

    describe("parseBackupFile", () => {
        it("reports the cbor format when parsing a CBOR backup", async () => {
            const file = backupFile(encode({ data: { chats: [{ id: "c1" }] } }));

            const parsed = await parseBackupFile(file);

            expect(parsed.data.chats).toEqual([{ id: "c1" }]);
            expect(logs).toContainEqual(
                expect.objectContaining({
                    level: "migration.importFormat",
                    data: { format: "cbor" },
                })
            );
        });

        it("rejects JSON without a data property", async () => {
            await expect(
                parseBackupFile(backupFile(JSON.stringify({ notData: true })))
            ).rejects.toThrow("missing 'data' property");
        });

        it("rejects a top-level JSON array", async () => {
            await expect(parseBackupFile(backupFile(JSON.stringify([1, 2, 3])))).rejects.toThrow(
                "missing 'data' property"
            );
        });

        it("rejects JSON whose data is null", async () => {
            await expect(
                parseBackupFile(backupFile(JSON.stringify({ data: null })))
            ).rejects.toThrow("missing 'data' property");
        });

        it("rejects JSON whose data is not an object", async () => {
            await expect(
                parseBackupFile(backupFile(JSON.stringify({ data: "text" })))
            ).rejects.toThrow("missing 'data' property");
        });

        it("rejects CBOR without a data property", async () => {
            await expect(parseBackupFile(backupFile(encode({ other: 1 })))).rejects.toThrow(
                "missing 'data' property"
            );
        });

        it("rejects CBOR whose data is a primitive", async () => {
            await expect(parseBackupFile(backupFile(encode({ data: 5 })))).rejects.toThrow(
                "missing 'data' property"
            );
        });

        it("rejects plain text with the first byte in the message", async () => {
            await expect(parseBackupFile(backupFile("plain text"))).rejects.toThrow(
                "Unknown backup format (first byte: 0x70)"
            );
        });

        it("rejects an empty file with an unknown-format error", async () => {
            await expect(parseBackupFile(backupFile(new Uint8Array(0)))).rejects.toThrow(
                /Unknown backup format/
            );
        });
    });

    describe("importBackup", () => {
        it("replaces the rows of tables present in the backup and leaves the other tables alone", async () => {
            await db.chats.put({ ...exampleChatData, id: "stale-chat" });
            await db.personas.put(persona);

            await importBackup({
                data: { chats: [{ ...exampleChatData, id: "fresh-chat" }] },
            });

            expect((await db.chats.toArray()).map((c) => c.id)).toEqual(["fresh-chat"]);
            expect(await db.personas.toArray()).toEqual([persona]);
        });

        it("keeps existing rows when the backup table is empty", async () => {
            await db.chats.put({ ...exampleChatData, id: "keep-chat" });

            await importBackup({ data: { chats: [] } });

            expect((await db.chats.toArray()).map((c) => c.id)).toEqual(["keep-chat"]);
        });

        it("ignores tables in the backup that the database does not have", async () => {
            await importBackup({ data: { unknownTable: [{ id: "x" }] } });

            expect(await db.chats.count()).toBe(0);
            expect(loggedMessages("error")).toEqual([]);
        });

        it("records the schema version after importing", async () => {
            await importBackup({ data: { personas: [persona] } });

            expect(checkStoredSchemaVersion()).toBe(currentSchemaVersion());
            expect(logs).toContainEqual(
                expect.objectContaining({
                    level: "migration.import",
                    data: { tableCount: TABLE_NAMES.length },
                })
            );
        });

        it("logs a failing table, keeps its old rows, and still imports the other tables", async () => {
            await db.chats.put({ ...exampleChatData, id: "old-chat" });
            const duplicated = { ...exampleChatData, id: "dup" };

            await importBackup({
                data: {
                    chats: [duplicated, duplicated],
                    personas: [persona],
                },
            });

            expect(loggedMessages("error")).toContain('[Migration] Failed to import table "chats"');
            expect((await db.chats.toArray()).map((c) => c.id)).toEqual(["old-chat"]);
            expect(await db.personas.toArray()).toEqual([persona]);
            expect(checkStoredSchemaVersion()).toBe(currentSchemaVersion());
        });
    });
});
