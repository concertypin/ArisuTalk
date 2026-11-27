/**
 * Backup/restore tests against a real (fake-indexeddb) Dexie database and the real cbor-x codec.
 * Data is seeded into the tables, serialized, wiped and restored, then compared with the seed.
 */
import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger, type AnyLogEntry } from "@common/logger/Logger";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import {
    checkStoredSchemaVersion,
    importBackup,
    markSchemaMigrated,
    parseBackupFile,
} from "@/lib/migration/storageMigration";
import { exampleChatData } from "@/const/example_data";
import type { Persona } from "@/features/persona/schema";
import { createLocalStorageMock } from "@test/utils/localStorageMock";

const SCHEMA_VERSION_KEY = "arisutalk_schema_version";
const db = getArisuDB();

const persona: Persona = { id: "persona-1", name: "Arisu", description: "Test persona" };

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

    describe("parseBackupFile", () => {
        it("rejects JSON without a data property", async () => {
            await expect(
                parseBackupFile(backupFile(JSON.stringify({ notData: true })))
            ).rejects.toThrow("missing 'data' property");
        });

        it("rejects JSON whose data is null", async () => {
            await expect(
                parseBackupFile(backupFile(JSON.stringify({ data: null })))
            ).rejects.toThrow("missing 'data' property");
        });

        it("rejects an empty file with an unknown-format error", async () => {
            await expect(parseBackupFile(backupFile(new Uint8Array(0)))).rejects.toThrow(
                /Unknown backup format/
            );
        });
    });

    describe("importBackup", () => {
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
