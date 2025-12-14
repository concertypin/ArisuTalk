import type { Character } from "@arisutalk/character-spec/v0/Character";

/**
 * Interface for character storage adapters.
 */
export interface ICharacterStorageAdapter {
    init(): Promise<void>;
    saveCharacter(character: Character): Promise<void>;
    getCharacter(id: string): Promise<Character | undefined>;
    getAllCharacters(): Promise<Character[]>;
    deleteCharacter(id: string): Promise<void>;
}
