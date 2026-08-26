/**
 * @file Sticker store — reactive state for sticker packs and active selection.
 * Uses IDBStickerAdapter for persistence, following the same pattern as characterStore.
 */

import type { Sticker, StickerPack, IStickerStorageAdapter } from "@/features/sticker";
import { IDBStickerAdapter } from "@/lib/adapters/storage/sticker/IDBStickerAdapter";
import { SvelteDate } from "svelte/reactivity";
import { Logger } from "@common/logger/Logger";

export class StickerStore {
    /** All loaded sticker packs. */
    packs = $state<StickerPack[]>([]);
    /** Currently selected pack ID (auto-set to first pack on load). */
    activePackId = $state<string | null>(null);

    private adapter: IStickerStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IStickerStorageAdapter) {
        this.adapter = adapter || new IDBStickerAdapter();
        this.initPromise = this.initialize();
    }

    private async initialize(): Promise<void> {
        await this.load();
    }

    /** The currently active sticker pack (derived from activePackId). */
    get activePack(): StickerPack | undefined {
        return this.packs.find((p) => p.id === this.activePackId);
    }

    /**
     * Load all sticker packs from storage.
     * Resets state on failure.
     */
    async load(): Promise<void> {
        try {
            await this.adapter.init();
            this.packs = await this.adapter.getAllPacks();
            if (!this.activePackId && this.packs.length > 0) {
                this.activePackId = this.packs[0].id;
            }
        } catch (e) {
            Logger.error("Failed to load sticker packs", e);
            this.packs = [];
        }
    }

    /**
     * Create a new sticker pack.
     * The pack is persisted and becomes the active pack.
     */
    async createPack(pack: StickerPack): Promise<void> {
        await this.adapter.savePack(pack);
        this.packs.push(pack);
        this.activePackId = pack.id;
    }

    /**
     * Delete a sticker pack by ID.
     * If it was the active pack, switches to the first remaining pack.
     */
    async deletePack(id: string): Promise<void> {
        await this.adapter.deletePack(id);
        const idx = this.packs.findIndex((p) => p.id === id);
        if (idx !== -1) this.packs.splice(idx, 1);
        if (this.activePackId === id) {
            this.activePackId = this.packs.length > 0 ? this.packs[0].id : null;
        }
    }

    /**
     * Update an existing sticker pack (name, description, sticker list, etc.).
     */
    async updatePack(updated: StickerPack): Promise<void> {
        await this.adapter.savePack(updated);
        const idx = this.packs.findIndex((p) => p.id === updated.id);
        if (idx !== -1) this.packs[idx] = updated;
    }

    /**
     * Add a sticker to a pack.
     * Mutates the local pack array and persists via adapter.
     */
    async addSticker(packId: string, sticker: Sticker): Promise<void> {
        await this.adapter.addStickerToPack(packId, sticker);
        const pack = this.packs.find((p) => p.id === packId);
        if (pack) {
            pack.stickers.push(sticker);
        }
    }

    /**
     * Remove a sticker from a pack by sticker ID.
     */
    async removeSticker(packId: string, stickerId: string): Promise<void> {
        await this.adapter.removeStickerFromPack(packId, stickerId);
        const pack = this.packs.find((p) => p.id === packId);
        if (pack) {
            pack.stickers = pack.stickers.filter((s) => s.id !== stickerId);
        }
    }

    /**
     * Replace the sticker list of a pack with a reordered array.
     * Useful after drag-and-drop reordering within the pack manager.
     */
    async reorderStickers(packId: string, stickers: Sticker[]): Promise<void> {
        const pack = this.packs.find((p) => p.id === packId);
        if (pack) {
            pack.stickers = stickers;
            pack.updatedAt = new SvelteDate().toISOString();
            await this.adapter.savePack(pack);
        }
    }

    /**
     * Reorder packs in the local list (drag-and-drop in sidebar).
     * Does NOT persist order (rely on pack array order only).
     */
    reorderPacks(fromIndex: number, toIndex: number): void {
        if (
            fromIndex < 0 ||
            fromIndex >= this.packs.length ||
            toIndex < 0 ||
            toIndex >= this.packs.length
        ) {
            return;
        }
        const item = this.packs.splice(fromIndex, 1)[0];
        this.packs.splice(toIndex, 0, item);
    }
}

/** Singleton sticker store instance. */
export const stickerStore = new StickerStore();
