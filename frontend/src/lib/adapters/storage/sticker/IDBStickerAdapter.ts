import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { IStickerStorageAdapter } from "@/lib/interfaces";
import type { Sticker, StickerPack } from "@/lib/types/sticker";

/**
 * IndexedDB-backed implementation of {@link IStickerStorageAdapter}.
 *
 * Stores each sticker pack as a row in the `stickers` Dexie table,
 * keyed by the pack's `id`.
 */
export class IDBStickerAdapter implements IStickerStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async getAllPacks(): Promise<StickerPack[]> {
        return this.db.stickers.toArray();
    }

    async getPack(id: string): Promise<StickerPack | undefined> {
        return this.db.stickers.get(id);
    }

    async savePack(pack: StickerPack): Promise<void> {
        await this.db.stickers.put(pack);
    }

    async deletePack(id: string): Promise<void> {
        await this.db.stickers.delete(id);
    }

    async addStickerToPack(packId: string, sticker: Sticker): Promise<void> {
        await this.db.stickers
            .where(":id")
            .equals(packId)
            .modify((pack) => {
                pack.stickers.push(sticker);
                pack.updatedAt = new Date().toISOString();
            });
    }

    async removeStickerFromPack(packId: string, stickerId: string): Promise<void> {
        await this.db.stickers
            .where(":id")
            .equals(packId)
            .modify((pack) => {
                pack.stickers = pack.stickers.filter((s) => s.id !== stickerId);
                pack.updatedAt = new Date().toISOString();
            });
    }
}

export default IDBStickerAdapter;
