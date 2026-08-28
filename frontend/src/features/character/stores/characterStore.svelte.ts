import { getCardParseWorker } from "@/lib/workers/workerClient";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import type { ICharacterStorageAdapter } from "@/lib/interfaces";
import { Logger } from "@common/logger/Logger";
import { SvelteSet } from "svelte/reactivity";

const ORDER_KEY = "character_order";

const PINNED_KEY = "pinned_characters";

export class CharacterStore {
    characters = $state<Character[]>([]);
    private adapter!: ICharacterStorageAdapter;
    public readonly initPromise: Promise<void>;

    private pinnedIds: string[] = $state([]);

    constructor(adapter?: ICharacterStorageAdapter) {
        this.initPromise = this.initialize(adapter);
        this.pinnedIds = [];
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
            if (!item) return [];
            const parsed: unknown = JSON.parse(item);
            return Array.isArray(parsed) && parsed.every((value) => typeof value === "string")
                ? parsed
                : [];
        } catch {
            return [];
        }
    }

    async load() {
        try {
            await this.adapter.init();
            const chars = await this.adapter.getAllCharacters();

            // Sort: pinned first, then by saved order
            const order = this.getOrder();
            const pinned = this.updatePinnedIds();
            const pinnedSet = new SvelteSet(pinned);
            if (order.length > 0 || pinned.length > 0) {
                const orderMap: Record<string, number> = Object.fromEntries(
                    order.map((id, index) => [id, index])
                );
                chars.sort((a, b) => {
                    const aPinned = pinnedSet.has(a.id) ? 0 : 1;
                    const bPinned = pinnedSet.has(b.id) ? 0 : 1;
                    if (aPinned !== bPinned) return aPinned - bPinned;
                    const idxA = orderMap[a.id];
                    const idxB = orderMap[b.id];
                    if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
                    if (idxA !== undefined) return -1;
                    if (idxB !== undefined) return 1;
                    return 0;
                });
            }

            this.characters = chars;
            chars.forEach((c) => {
                Logger.structured("character.load", {
                    characterId: c.id,
                    source: "local",
                });
            });
        } catch (e) {
            Logger.error("Failed to load characters", e);
            this.characters = [];
        }
    }

    async add(character: Character) {
        await this.adapter.saveCharacter(character);
        this.characters.push(character);
        this.saveOrder();
        Logger.structured("character.load", {
            characterId: character.id,
            source: "import",
        });
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

    // -- Pin / Unpin --------------------------------------------------------

    /**
     * Get list of pinned character IDs from localStorage.
     * and... Save pinned IDs to localStorage.
     */
    private updatePinnedIds(ids?: string[]): string[] {
        if (ids != null) {
            this.pinnedIds = ids;

            if (typeof localStorage !== "undefined") {
                localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
            }

            return ids;
        }

        try {
            const item = localStorage.getItem(PINNED_KEY);
            if (!item) return this.updatePinnedIds([]);
            const parsed: unknown = JSON.parse(item);
            const isValid = Array.isArray(parsed) && parsed.every((v) => typeof v === "string");

            this.pinnedIds = isValid ? parsed : [];
        } catch {
            this.pinnedIds = [];
        }

        return this.pinnedIds;
    }

    /**
     * Check if a character is pinned.
     * @param characterId The character ID to check.
     */
    isPinned(characterId: string): boolean {
        // return this.getPinnedIds().includes(characterId);
        return this.pinnedIds.includes(characterId);
    }

    /**
     * Toggle pin status for a character.
     * @param characterId The character ID to toggle.
     */
    togglePin(characterId: string): void {
        const pinned = this.pinnedIds;
        const idx = pinned.indexOf(characterId);
        if (idx >= 0) {
            pinned.splice(idx, 1);
        } else {
            pinned.unshift(characterId);
        }
        // this.savePinnedIds(pinned);
        this.updatePinnedIds(pinned);
        // Re-sort to reflect pinning
        this.sortByPinAndOrder();
    }

    /**
     * Re-sort characters: pinned first, then by saved order.
     */
    private sortByPinAndOrder() {
        const pinned = new SvelteSet(this.pinnedIds);
        const order = this.getOrder();
        const orderMap: Record<string, number> = Object.fromEntries(
            order.map((id, index) => [id, index])
        );
        this.characters = [...this.characters].sort((a, b) => {
            const aPinned = pinned.has(a.id) ? 0 : 1;
            const bPinned = pinned.has(b.id) ? 0 : 1;
            if (aPinned !== bPinned) return aPinned - bPinned;
            const idxA = orderMap[a.id];
            const idxB = orderMap[b.id];
            if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
            if (idxA !== undefined) return -1;
            if (idxB !== undefined) return 1;
            return 0;
        });
    }

    async importCharacter(file: File) {
        const buffer = await file.arrayBuffer();
        const worker = await getCardParseWorker();
        const format = file.name.split(".").pop() || "unknown";
        try {
            const result = await worker.parseCharacter(buffer);
            if (result.success) {
                // Check if already exists? For now just add.
                await this.add(result.data);
                Logger.structured("character.import", {
                    format,
                    success: true,
                });
                return { success: true };
            }
            Logger.structured("character.import", {
                format,
                success: false,
                errorMessage: "Failed to parse character",
            });
            return { success: false, error: "Failed to parse character" };
        } catch (e) {
            Logger.error(e);
            Logger.structured("character.import", {
                format,
                success: false,
                errorMessage: String(e),
            });
            return { success: false, error: String(e) };
        }
    }
}

export const characterStore = new CharacterStore();
