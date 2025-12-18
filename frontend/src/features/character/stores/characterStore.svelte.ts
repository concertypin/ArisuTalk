import { getCardParseWorker } from "@/lib/workers/workerClient";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";

const ORDER_KEY = "character_order";

export class CharacterStore {
    characters = $state<Character[]>([]);
    private adapter!: ICharacterStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: ICharacterStorageAdapter) {
        this.initPromise = this.initialize(adapter);
    }

    private async initialize(adapter?: ICharacterStorageAdapter) {
        this.adapter = adapter || (await StorageResolver.getCharacterAdapter());
        await this.load();
    }

    private saveOrder() {
        if (typeof localStorage === "undefined") return;
        const order = this.characters.map((c) => c.id);
        localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    }

    private getOrder(): string[] {
        if (typeof localStorage === "undefined") return [];
        try {
            const item = localStorage.getItem(ORDER_KEY);
            return item ? (JSON.parse(item) as string[]) : [];
        } catch {
            return [];
        }
    }

    async load() {
        try {
            await this.adapter.init();
            const chars = await this.adapter.getAllCharacters();

            // Sort by saved order
            const order = this.getOrder();
            if (order.length > 0) {
                // eslint-disable-next-line svelte/prefer-svelte-reactivity
                const orderMap = new Map(order.map((id, index) => [id, index]));
                chars.sort((a, b) => {
                    const idxA = orderMap.get(a.id);
                    const idxB = orderMap.get(b.id);
                    // If both present, sort by index
                    if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
                    // If only one present, present goes first? Or last?
                    // Usually appended items go last.
                    if (idxA !== undefined) return -1;
                    if (idxB !== undefined) return 1;
                    // Neither present, keep original order (or name sort?)
                    return 0;
                });
            }

            this.characters = chars;
        } catch (e) {
            console.error("Failed to load characters", e);
            this.characters = [];
        }
    }

    async add(character: Character) {
        await this.adapter.saveCharacter(character);
        this.characters.push(character);
        this.saveOrder();
    }

    async remove(index: number) {
        const char = this.characters[index];
        if (char) {
            const id = char.id;
            await this.adapter.deleteCharacter(id);
            this.characters.splice(index, 1);
            this.saveOrder();
        }
    }

    async update(index: number, updated: Character) {
        if (index >= 0 && index < this.characters.length) {
            await this.adapter.saveCharacter(updated);
            this.characters[index] = updated;
            // Order doesn't change on update usually, unless we want to move to top?
            // No, keep position.
        }
    }

    reorder(fromIndex: number, toIndex: number) {
        if (
            fromIndex < 0 ||
            fromIndex >= this.characters.length ||
            toIndex < 0 ||
            toIndex >= this.characters.length
        ) {
            return;
        }

        const item = this.characters.splice(fromIndex, 1)[0];
        this.characters.splice(toIndex, 0, item);
        this.saveOrder();
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
        }
    }
}

export const characterStore = new CharacterStore();
