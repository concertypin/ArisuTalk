import type { ICharacterStorageAdapter } from "@/lib/interfaces";
import type { Character } from "@arisutalk/character-spec/v0/Character";

/**
 * LocalStorage-based character storage adapter.
 * For development/testing purposes only.
 */
export class LocalStorageCharacterAdapter implements ICharacterStorageAdapter {
    private readonly KEY = "arisutalk_characters";

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    private isCharacter(value: unknown): value is Character {
        return (
            this.isRecord(value) && typeof value.id === "string" && typeof value.name === "string"
        );
    }

    async init(): Promise<void> {
        if (!import.meta.env.DEV) {
            console.warn("LocalStorageCharacterAdapter is for development/testing only.");
        }
        return Promise.resolve();
    }

    private getStored(): Character[] {
        const item = localStorage.getItem(this.KEY);
        if (!item) return [];
        try {
            const parsed = JSON.parse(item) as unknown;
            if (!Array.isArray(parsed)) return [];
            const parsedArray: unknown[] = parsed;
            return parsedArray.filter((c): c is Character => this.isCharacter(c));
        } catch {
            return [];
        }
    }

    private setStored(data: Character[]): void {
        localStorage.setItem(this.KEY, JSON.stringify(data));
    }

    async saveCharacter(character: Character): Promise<void> {
        const characters = this.getStored();
        const index = characters.findIndex((c) => c.id === character.id);

        if (index >= 0) {
            characters[index] = character;
        } else {
            characters.push(character);
        }
        this.setStored(characters);
    }

    async getCharacter(id: string): Promise<Character | undefined> {
        const characters = this.getStored();
        return characters.find((c) => c.id === id);
    }

    async getAllCharacters(): Promise<Character[]> {
        return this.getStored();
    }

    async deleteCharacter(id: string): Promise<void> {
        const characters = this.getStored();
        const filtered = characters.filter((c) => c.id !== id);
        this.setStored(filtered);
    }
}
