import { createStore, type Store, type Table } from "tinybase";
import {
    createIndexedDbPersister,
    type IndexedDbPersister,
} from "tinybase/persisters/persister-indexed-db";
import type { Chat, Character } from "@arisutalk/character-spec/v0/Character";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import type { Settings } from "@/lib/types/IDataModel";
import type { Persona } from "@/features/persona/schema";

type TableId = "chats" | "characters" | "settings" | "personas" | "messages";
const TABLES: TableId[] = ["chats", "characters", "settings", "personas", "messages"];
type SettingsRow = Settings | { id: string; value?: string; activePersonaId?: string };

class TinybaseTable<T extends object> {
    constructor(
        private readonly store: Store,
        private readonly tableId: TableId,
        private readonly ready: Promise<void>
    ) {}

    private async ensureReady() {
        await this.ready;
    }

    private serialize(value: T, key?: string): { id: string; row: { id: string; json: string } } {
        const record = value as Record<string, unknown>;
        const idFromValue = typeof record.id === "string" ? record.id : undefined;
        const id = key ?? idFromValue;
        if (!id) throw new Error("Missing key for put()");
        return { id, row: { id, json: JSON.stringify(value) } };
    }

    private parseRow(stored: { json?: string } | undefined): T | undefined {
        if (!stored?.json) return undefined;
        try {
            return JSON.parse(stored.json) as T;
        } catch {
            return undefined;
        }
    }

    async put(value: T, key?: string): Promise<string> {
        await this.ensureReady();
        const { id, row } = this.serialize(value, key);
        this.store.setRow(this.tableId, id, row);
        return id;
    }

    async bulkPut(values: T[]): Promise<void> {
        await this.ensureReady();
        for (const value of values) {
            const { id, row } = this.serialize(value);
            this.store.setRow(this.tableId, id, row);
        }
    }

    async get(key: string): Promise<T | undefined> {
        await this.ensureReady();
        const stored = this.store.getRow(this.tableId, key) as { json?: string } | undefined;
        return this.parseRow(stored);
    }

    async delete(key: string): Promise<void> {
        await this.ensureReady();
        this.store.delRow(this.tableId, key);
    }

    async clear(): Promise<void> {
        await this.ensureReady();
        this.store.delTable(this.tableId);
        this.store.setTable(this.tableId, {});
    }

    async toArray(): Promise<T[]> {
        await this.ensureReady();
        const table = this.store.getTable(this.tableId) as Table | undefined;
        if (!table) return [];
        const rows: T[] = [];
        for (const stored of Object.values(table) as Array<{ json?: string }>) {
            const parsed = this.parseRow(stored);
            if (parsed !== undefined) rows.push(parsed);
        }
        return rows;
    }

    where<K extends keyof T>(field: K) {
        const equals = (value: T[K]) => ({
            toArray: async () => {
                const rows = await this.toArray();
                return rows.filter((row) => row[field] === value);
            },
        });

        return { equals } as const;
    }
}

class TinyArisuDB {
    private readonly store: Store;
    private readonly persister: IndexedDbPersister | null;
    private readonly readyPromise: Promise<void>;
    private readonly dbName = "arisutalk";
    private readonly enablePersistence: boolean;

    chats: TinybaseTable<Chat>;
    characters: TinybaseTable<Character>;
    settings: TinybaseTable<SettingsRow>;
    personas: TinybaseTable<Persona>;
    messages: TinybaseTable<Message>;

    constructor() {
        this.store = createStore();
        const nodeEnv =
            typeof globalThis !== "undefined"
                ? (
                      globalThis as {
                          process?: { env?: Record<string, string | undefined> };
                      }
                  ).process?.env?.NODE_ENV
                : undefined;
        const mode =
            typeof import.meta !== "undefined"
                ? ((import.meta as { env?: { MODE?: string } }).env?.MODE ?? nodeEnv)
                : nodeEnv;
        const isTestEnv = mode === "test";
        const hasIndexedDb = typeof indexedDB !== "undefined";
        this.enablePersistence = hasIndexedDb && !isTestEnv;

        this.persister = this.createPersister();
        this.readyPromise = this.startPersistence();

        this.chats = new TinybaseTable<Chat>(this.store, "chats", this.readyPromise);
        this.characters = new TinybaseTable<Character>(this.store, "characters", this.readyPromise);
        this.settings = new TinybaseTable<SettingsRow>(this.store, "settings", this.readyPromise);
        this.personas = new TinybaseTable<Persona>(this.store, "personas", this.readyPromise);
        this.messages = new TinybaseTable<Message>(this.store, "messages", this.readyPromise);
    }

    private createPersister(): IndexedDbPersister | null {
        if (!this.enablePersistence) return null;

        try {
            return createIndexedDbPersister(this.store, this.dbName);
        } catch {
            return null;
        }
    }

    private async clearPersistedStorage(): Promise<void> {
        if (!this.enablePersistence || !("indexedDB" in globalThis)) return;

        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(this.dbName);
            req.onerror = () => resolve();
            req.onsuccess = () => resolve();
            req.onblocked = () => resolve();
        });
    }

    private ensureTables() {
        for (const table of TABLES) {
            if (!this.store.getTable(table)) this.store.setTable(table, {});
        }
    }

    private async startPersistence(): Promise<void> {
        this.ensureTables();
        if (this.persister) {
            await this.persister.load();
            await this.persister.startAutoSave();
        }
        this.ensureTables();
    }

    async ready(): Promise<void> {
        await this.readyPromise;
    }

    async delete(): Promise<void> {
        await this.readyPromise;
        for (const table of TABLES) {
            this.store.setTable(table, {});
        }
        await this.clearPersistedStorage();
        if (this.persister) {
            await this.persister.save();
        }
        instance = null;
    }
}

let instance: TinyArisuDB | null = null;

/**
 * Provides a singleton Tinybase-backed store compatible with the previous Dexie API.
 */
export function getArisuDB(): TinyArisuDB {
    if (!instance) instance = new TinyArisuDB();
    return instance;
}
