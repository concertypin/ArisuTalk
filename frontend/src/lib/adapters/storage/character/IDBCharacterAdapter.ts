import type { Character } from "@arisutalk/character-spec/v0/Character";
import { getArisuDB } from "../IndexedDBHelper";
import type { ICharacterStorageAdapter, CharacterMetadata } from "@/lib/interfaces";

export class IDBCharacterAdapter implements ICharacterStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async saveCharacter(character: Character): Promise<void> {
        await this.db.characters.put(character);
    }

    async getCharacter(id: string): Promise<Character | undefined> {
        return this.db.characters.get(id);
    }

    async getAllCharacters(): Promise<Character[]> {
        return this.db.characters.toArray();
    }

    async getCharactersMetadata(): Promise<CharacterMetadata[]> {
        // Dexie allows mapping on collection.
        // However, to be truly efficient and not load the blob fields,
        // we assume the DB is storing object.
        // If the object is stored as a whole, Dexie might load the whole object to memory before mapping.
        // But since we are using IndexedDB, usually we can't select partial fields unless we use a cursor and careful cursor handling.
        // Dexie's `toArray` loads everything.
        // A better approach in Dexie for massive data is using `each` or `cursor`.
        // But for now, if the store structure is a single object, we can't avoid loading the object from disk to memory in IDB layer.
        // BUT, we can avoid returning the huge object to the main thread (if using worker) or at least avoid holding references to it in the array.

        // Wait, Dexie doesn't support 'selecting' fields in `toArray`.
        // However, we can use `offset`/`limit` if we were paginating.
        // To strictly follow "ready-to-scale", if the objects are huge, storing them as single blob in IDB is bad if we want list.
        // Ideally, we should have a separate 'metadata' store or index.
        // But given the current schema `characters: "id, name, specVersion"`, we can only index those.
        // Reading the whole object is necessary to get `description` and `avatarUrl` if they are not indexed.
        // But we can map it and GC the full object immediately.

        const list: CharacterMetadata[] = [];
        await this.db.characters.each((char) => {
            list.push({
                id: char.id,
                name: char.name,
                description: char.description,
                avatarUrl: char.avatarUrl,
            });
        });
        return list;
    }

    async deleteCharacter(id: string): Promise<void> {
        await this.db.characters.delete(id);
    }
}
export default IDBCharacterAdapter;
