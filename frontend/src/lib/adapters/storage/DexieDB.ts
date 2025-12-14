import Dexie, { Table } from "dexie";
import type { Chat, Character } from "@arisutalk/character-spec/v0/Character";
import type { Settings } from "@/lib/types/IDataModel";
import type { Persona } from "@/features/persona/schema";

interface _ArisuDBSchema {
    chats: Chat;
    characters: Character;
    settings: Settings & { id: string };
    personas: Persona;
}

class ArisuDB extends Dexie {
    chats!: Table<Chat, string>;
    characters!: Table<Character, string>;
    settings!: Table<(Settings & { id: string }) | Record<string, unknown>, string>;
    personas!: Table<Persona, string>;

    constructor() {
        super("ArisuTalkDB");
        this.version(1).stores({
            chats: "id",
            characters: "id",
            personas: "id",
            settings: "id",
        });
    }
}

let instance: ArisuDB | undefined;
export function getArisuDB(): ArisuDB {
    const dbInstance = instance satisfies { isOpen?: () => boolean } | undefined;
    if (!instance || !dbInstance?.isOpen?.()) instance = new ArisuDB();
    return instance;
}
