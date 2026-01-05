import type {
    ICharacterStorageAdapter,
    CharacterMetadata,
} from "@/lib/interfaces/ICharacterStorageAdapter";
import type { Character } from "@arisutalk/character-spec/v0/Character";

const BASE_URL = "http://localhost:3000";

export class ServerCharacterAdapter implements ICharacterStorageAdapter {
    async init(): Promise<void> {
        // No-op or check connectivity
        try {
            await fetch(`${BASE_URL}/characters`, { method: "HEAD" });
        } catch (e) {
            console.warn("ServerCharacterAdapter: Could not connect to server.", e);
        }
    }

    async saveCharacter(character: Character): Promise<void> {
        const res = await fetch(`${BASE_URL}/characters`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(character),
        });
        if (!res.ok) throw new Error(`Failed to save character: ${res.statusText}`);
    }

    async getCharacter(id: string): Promise<Character | undefined> {
        const res = await fetch(`${BASE_URL}/characters/${id}`);
        if (res.status === 404) return undefined;
        if (!res.ok) throw new Error(`Failed to get character: ${res.statusText}`);
        const data = (await res.json()) as Character;
        return data;
    }

    async getAllCharacters(): Promise<Character[]> {
        const res = await fetch(`${BASE_URL}/characters`);
        if (!res.ok) throw new Error(`Failed to get all characters: ${res.statusText}`);
        const data = (await res.json()) as Character[];
        return data;
    }

    async getCharactersMetadata(): Promise<CharacterMetadata[]> {
        // Server might support a lightweight endpoint, but for now fetch all and map
        const characters = await this.getAllCharacters();
        return characters.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            avatarUrl: c.avatarUrl,
        }));
    }

    async deleteCharacter(id: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/characters/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete character: ${res.statusText}`);
    }
}
export default ServerCharacterAdapter;
