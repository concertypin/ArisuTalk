import { getCardParseWorker } from "@/lib/workers/workerClient";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { LocalStorageAdapter } from "@/features/character/adapters/storage/LocalStorageAdapter";
import type { IStorageAdapter } from "@/lib/interfaces/IStorageAdapter";
import type IAssetStorageAdapter from "@/lib/interfaces/IAssetStorageAdapter";

export class CharacterStore {
    characters = $state<Character[]>([]);
    private adapter: IStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IStorageAdapter, assetsAdapter?: IAssetStorageAdapter) {
        this.adapter = adapter || new LocalStorageAdapter();
        this.initPromise = this.load();
    }

    async load() {
        try {
            await this.adapter.init();
            this.characters = await this.adapter.getAllCharacters();
        } catch (e) {
            console.error("Failed to load characters", e);
            this.characters = [];
        }
    }

    async add(character: Character) {
        await this.adapter.saveCharacter(character);
        this.characters.push(character);
    }

    async remove(index: number) {
        const char = this.characters[index];
        if (char) {
            // Using name as ID for now based on LocalStorageAdapter implementation
            // Ideally Character has an ID.
            // todo
            const id = char.id || char.name;
            await this.adapter.deleteCharacter(id);
            this.characters.splice(index, 1);
        }
    }

    async update(index: number, updated: Character) {
        if (index >= 0 && index < this.characters.length) {
            await this.adapter.saveCharacter(updated);
            this.characters[index] = updated;
        }
    }

    async importCharacter(file: File) {
        const buffer = await file.arrayBuffer();
        const worker = await getCardParseWorker();
        try {
            const result = await worker.parseCharacter(buffer);
            if (result.success) {
                // Check if already exists? For now just add.
                await this.add(result.data);
                return { success: true };
            } else {
                return { success: false, error: "Failed to parse character" };
            }
        } catch (e) {
            console.error(e);
            return { success: false, error: String(e) };
        } finally {
            worker.terminate();
        }
    }
}

export const characterStore = new CharacterStore();
