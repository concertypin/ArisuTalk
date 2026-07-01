/**
 * @fileoverview Storage migration utilities for IndexedDB schema and data migrations.
 * Provides version tracking, migration hooks, and backup/restore helpers.
 */
import { encode, decode } from "cbor-x";
import { Logger } from "@common/logger/Logger";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";

/** MIME type for CBOR-encoded backup files. */
const CBOR_MIME = "application/octet-stream";
/** File extension for backup files. */
const BACKUP_EXT = ".aribackup";
/** First byte of a CBOR map (definite-length, size 0–23). All JSON text starts with `{` (0x7B) or `[` (0x5B). */
const CBOR_MAP_START_MIN = 0xa0;
const CBOR_MAP_START_MAX = 0xbf;

/** Schema version marker in localStorage for tracking. */
const SCHEMA_VERSION_KEY = "arisutalk_schema_version";

/**
 * Current expected schema version.
 * Increment when making breaking data format changes.
 */
const CURRENT_SCHEMA_VERSION = 3;

/**
 * Check if stored data needs migration.
 * @returns The stored schema version, or 0 if not set.
 */
export function checkStoredSchemaVersion(): number {
    if (typeof localStorage === "undefined") return CURRENT_SCHEMA_VERSION;
    try {
        const stored = localStorage.getItem(SCHEMA_VERSION_KEY);
        return stored ? Number(stored) : 0;
    } catch {
        return 0;
    }
}

/**
 * Mark the current schema version as migrated.
 */
export function markSchemaMigrated(): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
    Logger.structured("migration.schemaVersion", { version: CURRENT_SCHEMA_VERSION });
}

type ExportAllDataResult = {
    _exportedAt: string;
    _schemaVersion: number;
    _appVersion: string;
    data: Record<string, unknown[]>;
};

/**
 * Export all IndexedDB data as a JSON-serializable backup object.
 * @returns A promise that resolves to a backup object containing all tables.
 */
export async function exportAllData(): Promise<ExportAllDataResult> {
    const db = getArisuDB();
    const tables = db.tables;
    const backup: Record<string, unknown[]> = {};

    for (const table of tables) {
        try {
            backup[table.name] = await table.toArray();
        } catch (e) {
            Logger.warn(`[Migration] Failed to export table "${table.name}"`, e);
            backup[table.name] = [];
        }
    }

    Logger.structured("migration.export", { tableCount: tables.length });

    return {
        _exportedAt: new Date().toISOString(),
        _schemaVersion: CURRENT_SCHEMA_VERSION,
        _appVersion: "ArisuTalk Kei",
        data: backup,
    };
}
/**
 * Serialize a backup object to a CBOR-encoded Blob for download.
 * Uses `cbor-x` encoding which is more compact than JSON.
 *
 * @returns A Blob containing the CBOR-encoded backup data.
 */
export async function exportDataAsBlob(): Promise<Blob> {
    const data = await exportAllData();
    const encoded = encode(data);
    Logger.structured("migration.exportBlob", {
        rawBytes: new Blob([JSON.stringify(data)]).size,
        cborBytes: encoded.byteLength,
        ratio: (encoded.byteLength / new Blob([JSON.stringify(data)]).size).toFixed(2),
    });
    return new Blob([encoded], { type: CBOR_MIME });
}

/**
 * Read a backup file and parse it, supporting both CBOR (new) and JSON (legacy) formats.
 * Detection is based on the first byte:
 * - CBOR map objects start with a byte in range 0xA0–0xBF
 * - JSON text starts with `{` (0x7B) or `[` (0x5B)
 *
 * @param file - The backup file to parse (`.aribackup` or `.json`).
 * @returns The parsed backup object.
 */
export async function parseBackupFile(file: File): Promise<{ data: Record<string, unknown[]> }> {
    const buffer = await file.arrayBuffer();
    const firstByte = new Uint8Array(buffer.slice(0, 1))[0];

    // JSON starts with `{` (0x7B) or `[` (0x5B); CBOR maps start at 0xA0+
    if (firstByte === 0x7b || firstByte === 0x5b) {
        // Legacy JSON format
        const text = new TextDecoder().decode(buffer);
        const parsed = JSON.parse(text);
        if (!parsed.data || typeof parsed.data !== "object") {
            throw new Error("Invalid backup file: missing 'data' property");
        }
        Logger.structured("migration.importFormat", { format: "json" });
        return parsed;
    }

    // CBOR format
    if (firstByte >= CBOR_MAP_START_MIN && firstByte <= CBOR_MAP_START_MAX) {
        const parsed = decode(buffer) as { data: Record<string, unknown[]> };
        if (!parsed.data || typeof parsed.data !== "object") {
            throw new Error("Invalid backup file: missing 'data' property");
        }
        Logger.structured("migration.importFormat", { format: "cbor" });
        return parsed;
    }

    throw new Error(
        `Unknown backup format (first byte: 0x${firstByte.toString(16)}). Expected CBOR or JSON.`
    );
}

/**
 * Import data from a backup object into IndexedDB.
 * Clears existing data before importing.
 *
 * @param backup - The backup object to restore from.
 * @returns A promise that resolves when the import is complete.
 */
export async function importBackup(backup: { data: Record<string, unknown[]> }): Promise<void> {
    const db = getArisuDB();
    const tables = db.tables;

    for (const table of tables) {
        const rows = backup.data[table.name];
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
            continue;
        }
        try {
            await table.clear();
            await table.bulkAdd(rows as never[]);
        } catch (e) {
            Logger.error(`[Migration] Failed to import table "${table.name}"`, e);
        }
    }

    markSchemaMigrated();
    Logger.structured("migration.import", { tableCount: tables.length });
}
