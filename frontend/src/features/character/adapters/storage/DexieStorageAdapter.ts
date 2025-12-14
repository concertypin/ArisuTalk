import Dexie, { Table } from "dexie";
// Legacy combined adapter migrated from previous codebase (see: [original/path/to/LegacyDexieAdapter.ts], migrated as part of storage refactor 2024-06). Prefer using hierarchical adapters under lib/adapters/storage/* for new code.
import {
    type Chat,
    type Character,
    CharacterSchema,
    ChatSchema,
} from "@arisutalk/character-spec/v0/Character";
import { Settings, SettingsSchema } from "@/lib/types/IDataModel";
import type { Persona } from "@/features/persona/schema";

/**
 * Dexie.js database schema for ArisuTalk.
 */
interface _ArisuDBSchema {
    chats: Chat;
    characters: Character;
    settings: Settings & { id: string };
    persona: Persona;
}

/**
 * Dexie-based storage adapter for ArisuTalk.*
 */
class ArisuDB extends Dexie {
    chats!: Table<Chat, string>;
    characters!: Table<Character, string>;
    settings!: Table<Settings & { id: string }, string>;
    persona!: Table<Persona, string>;

    constructor() {
        super("ArisuTalkDB");
        this.version(1).stores({
            chats: "id",
            characters: "id",
            persona: "id",
            settings: "id",
        });
    }
}

export class DexieStorageAdapter {
    private db?: ArisuDB;

    async init(): Promise<void> {
        if (!this.db) this.db = new ArisuDB();
        return Promise.resolve();
    }

    private async ensureDb() {
        if (!this.db) await this.init();
        return this.db!;
    }

    async saveChat(chat: Chat): Promise<void> {
        const db = await this.ensureDb();
        await db.chats.put(chat);
    }

    async getChat(id: string): Promise<Chat | undefined> {
        const db = await this.ensureDb();
        return db.chats.get(id);
    }

    async getAllChats(): Promise<Chat[]> {
        const db = await this.ensureDb();
        return db.chats.toArray();
    }

    async deleteChat(id: string): Promise<void> {
        const db = await this.ensureDb();
        await db.chats.delete(id);
    }

    async saveCharacter(character: Character): Promise<void> {
        const db = await this.ensureDb();
        await db.characters.put(character);
    }

    async getCharacter(id: string): Promise<Character | undefined> {
        const db = await this.ensureDb();
        return db.characters.get(id);
    }

    async getAllCharacters(): Promise<Character[]> {
        const db = await this.ensureDb();
        return db.characters.toArray();
    }

    async deleteCharacter(id: string): Promise<void> {
        const db = await this.ensureDb();
        await db.characters.delete(id);
    }

    async saveSettings(settings: Settings): Promise<void> {
        const db = await this.ensureDb();
        await db.settings.put({ ...settings, id: "singleton" });
    }

    async getSettings(): Promise<Settings> {
        const db = await this.ensureDb();
        const stored = await db.settings.get("singleton");
        const inst = SettingsSchema.parse({});
        if (!stored) return inst;
        Object.assign(inst, stored);
        return inst;
    }

    async exportData(): Promise<ReadableStream<Uint8Array>> {
        const db = await this.ensureDb();
        const [chats, characters, settings] = await Promise.all([
            db.chats.toArray(),
            db.characters.toArray(),
            db.settings.get("singleton"),
        ]);

        const data = { chats, characters, settings };
        const json = JSON.stringify(data);
        const encoder = new TextEncoder();
        const uint8 = encoder.encode(json);

        return new ReadableStream({
            start(controller) {
                controller.enqueue(uint8);
                controller.close();
            },
        });
    }

    async importData(stream: ReadableStream<Uint8Array>): Promise<void> {
        const db = await this.ensureDb();
        try {
            const buffer = await new Response(stream).arrayBuffer();
            const json = new TextDecoder().decode(buffer);
            const data = JSON.parse(json);

            await db.transaction("rw", db.chats, db.characters, db.settings, async () => {
                if (Array.isArray(data.chats)) {
                    await db.chats.clear();
                    if (data.chats.length)
                        await db.chats.bulkPut(ChatSchema.array().parse(data.chats));
                }

                if (Array.isArray(data.characters)) {
                    await db.characters.clear();
                    if (data.characters.length)
                        await db.characters.bulkPut(CharacterSchema.array().parse(data.characters));
                }

                if (data.settings) {
                    await db.settings.put({
                        ...SettingsSchema.parse(data.settings),
                        id: "singleton",
                    });
                }
            });
        } catch (e) {
            console.error("Failed to import data", e);
            throw new Error(`Invalid data format: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
}
