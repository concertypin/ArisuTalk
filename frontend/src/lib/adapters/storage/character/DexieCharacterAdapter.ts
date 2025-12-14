import type { Character } from "@arisutalk/character-spec/v0/Character";
import { getArisuDB } from "../DexieDB";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";

export class DexieCharacterAdapter implements ICharacterStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        return Promise.resolve();
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

    async deleteCharacter(id: string): Promise<void> {
        await this.db.characters.delete(id);
    }
}
