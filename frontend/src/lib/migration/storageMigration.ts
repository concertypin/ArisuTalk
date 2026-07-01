/**
 * @fileoverview Storage migration utilities for IndexedDB schema and data migrations.
 * Provides version tracking, migration hooks, and backup/restore helpers.
 */

import { Logger } from "@common/logger/Logger";
import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";

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

/**
 * Export all IndexedDB data as a JSON-serializable backup object.
 * @returns A promise that resolves to a backup object containing all tables.
 */
export async function exportAllData(): Promise<Record<string, unknown[]>> {
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
