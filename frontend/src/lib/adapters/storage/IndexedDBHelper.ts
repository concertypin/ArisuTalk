import Dexie, { type Table } from "dexie";
import type { Chat, Character } from "@arisutalk/character-spec/v0/Character";
import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import type { StickerPack } from "@/lib/types/sticker";
import type { MemoryEntry } from "@/lib/types/memory";
import type { Settings } from "@/lib/types/IDataModel";
import type { Persona } from "@/features/persona/schema";

/**
 * Dexie.js-based IndexedDB database for ArisuTalk.
 * Stores data as proper rows with indexed columns for efficient querying.
 */
class ArisuDB extends Dexie {
    chats!: Table<Chat, string>;
    characters!: Table<Character, string>;
    settings!: Table<Settings & { id: string }, string>;
    personas!: Table<Persona, string>;
    messages!: Table<Message, string>;
    stickers!: Table<StickerPack, string>;
    memories!: Table<MemoryEntry, string>;

    constructor() {
        super("arisutalk");

        // Define schema with indexed columns
        this.version(1).stores({
            chats: "id, characterId, title, createdAt, updatedAt",
            characters: "id, name, specVersion",
            settings: "id",
            personas: "id, name",
            messages: "id, chatId, role, timestamp",
        });

        this.version(2).stores({
            chats: "id, characterId, title, createdAt, updatedAt",
            characters: "id, name, specVersion",
            settings: "id",
            personas: "id, name",
            messages: "id, chatId, role, timestamp",
            stickers: "id, name",
        });

        this.version(3).stores({
            chats: "id, characterId, title, createdAt, updatedAt",
            characters: "id, name, specVersion",
            settings: "id",
            personas: "id, name",
            messages: "id, chatId, role, timestamp",
            stickers: "id, name",
            memories: "id, characterId, type, timestamp, importance",
        });
    }

    async deleteAll(): Promise<void> {
        await this.chats.clear();
        await this.characters.clear();
        await this.settings.clear();
        await this.personas.clear();
        await this.messages.clear();
        await this.stickers.clear();
        await this.memories.clear();
    }
}

let instance: ArisuDB | null = null;

/**
 * Provides a singleton Dexie-backed IndexedDB store.
 * @returns The singleton ArisuDB instance.
 */
export function getArisuDB(): ArisuDB {
    if (!instance) instance = new ArisuDB();
    return instance;
}
