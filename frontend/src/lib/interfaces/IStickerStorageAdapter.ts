import type { Sticker, StickerPack } from "@/lib/types/sticker";

/**
 * Interface for sticker storage adapters.
 * Handles persistence of sticker packs and their stickers.
 */
export interface IStickerStorageAdapter {
    /**
     * Initializes the storage adapter (e.g., opens DB connection).
     */
    init(): Promise<void>;

    /**
     * Retrieves all sticker packs.
     * @returns Promise resolving to an array of all sticker packs.
     */
    getAllPacks(): Promise<StickerPack[]>;

    /**
     * Retrieves a single sticker pack by ID.
     * @param id - The ID of the pack to retrieve.
     * @returns Promise resolving to the sticker pack, or `undefined` if not found.
     */
    getPack(id: string): Promise<StickerPack | undefined>;

    /**
     * Saves (creates or overwrites) a sticker pack.
     * @param pack - The sticker pack to save.
     */
    savePack(pack: StickerPack): Promise<void>;

    /**
     * Deletes a sticker pack by ID.
     * @param id - The ID of the pack to delete.
     */
    deletePack(id: string): Promise<void>;

    /**
     * Adds a sticker to an existing pack.
     * @param packId - The ID of the pack to add the sticker to.
     * @param sticker - The sticker to add.
     */
    addStickerToPack(packId: string, sticker: Sticker): Promise<void>;

    /**
     * Removes a sticker from an existing pack.
     * @param packId - The ID of the pack to remove the sticker from.
     * @param stickerId - The ID of the sticker to remove.
     */
    removeStickerFromPack(packId: string, stickerId: string): Promise<void>;
}
