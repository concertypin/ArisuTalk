import type { Character } from "@arisutalk/character-spec/v0/Character";

/**
 * Lightweight character metadata for lists.
 */
export type CharacterMetadata = Pick<Character, "id" | "name" | "description" | "avatarUrl">;

/**
 * Interface for character storage adapters.
 */
export interface ICharacterStorageAdapter {
    init(): Promise<void>;
    saveCharacter(character: Character): Promise<void>;
    getCharacter(id: string): Promise<Character | undefined>;
    getAllCharacters(): Promise<Character[]>;
    getCharactersMetadata(): Promise<CharacterMetadata[]>;
    deleteCharacter(id: string): Promise<void>;
}
