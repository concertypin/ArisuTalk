/**
 * Source of a sticker's image data.
 * - `'emoji'`: Rendered from an emoji character.
 * - `'upload'`: User-uploaded image.
 * - `'novelai'`: Generated via NovelAI image generation.
 */
export type StickerSource = "emoji" | "upload" | "novelai";

/**
 * Represents a single sticker within a pack.
 * The sticker's visual content is determined by one of:
 * - `emoji` — rendered from the emoji string in `emoji`
 * - `upload` / `novelai` — resolved via `imageUrl`, with optional raw data in `data`
 */
export interface Sticker {
    /** Unique identifier for this sticker. */
    id: string;
    /** Display name for the sticker. */
    name: string;
    /** Emoji character used when `source` is `'emoji'`. */
    emoji?: string;
    /** URL to the sticker image (for `upload` or `novelai` sources). */
    imageUrl?: string;
    /** Origin of the sticker visual data. */
    source: StickerSource;
    /**
     * Raw sticker data (e.g. base64-encoded image, emoji codepoint).
     * Contents depend on `source`.
     */
    data?: string;
}

/**
 * A collection of stickers that can be used in chat.
 * Each pack groups related stickers (e.g. by theme or character).
 */
export interface StickerPack {
    /** Unique identifier for this sticker pack. */
    id: string;
    /** Human-readable name of the pack. */
    name: string;
    /** Optional description of the pack's theme or contents. */
    description?: string;
    /** Stickers belonging to this pack. */
    stickers: Sticker[];
    /** ISO-8601 timestamp when the pack was created. */
    createdAt: string;
    /** ISO-8601 timestamp of the last modification to this pack. */
    updatedAt: string;
}
