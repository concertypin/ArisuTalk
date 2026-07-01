/**
 * @fileoverview Store managing NovelAI image generation state and operations.
 * Handles config persistence, image generation, and saving results to sticker packs.
 */

import type { NovelAIConfig } from "@/lib/types/IDataModel";
import type { Sticker, StickerPack } from "@/lib/types/sticker";
import type { IStickerStorageAdapter } from "@/lib/interfaces";
import { IDBStickerAdapter } from "@/lib/adapters/storage/sticker/IDBStickerAdapter";
import { Logger } from "@common/logger/Logger";

let stickerAdapter: IStickerStorageAdapter | null = null;

/**
 * Returns the sticker storage adapter (lazily initialised singleton).
 */
async function getStickerAdapter(): Promise<IStickerStorageAdapter> {
    if (!stickerAdapter) {
        stickerAdapter = new IDBStickerAdapter();
        await stickerAdapter.init();
    }
    return stickerAdapter;
}

/**
 * Generates a short unique ID for sticker records.
 */
function uid(): string {
    return crypto.randomUUID();
}

class NovelaiStore {
    /** Current NovelAI configuration (API key, model, parameters). */
    config = $state<NovelAIConfig>({
        apiKey: "",
        model: "nai-diffusion-4",
        width: 1024,
        height: 1024,
        scale: 7,
        steps: 28,
    });

    /** Whether an image generation request is in flight. */
    isGenerating = $state(false);

    /**
     * The most recently generated image as a Blob.
     * `null` when no image has been generated or after reset.
     */
    generatedImage = $state<Blob | null>(null);

    /**
     * Object URL for previewing the generated image in `<img>` tags.
     * Automatically revoked when a new image is generated.
     */
    previewUrl = $state<string | null>(null);

    /**
     * Error message from the last failed generation, if any.
     */
    error = $state<string | null>(null);

    /**
     * Generate an image from the current config and prompt.
     *
     * @param prompt - The text prompt describing the image.
     * @throws If generation fails (error is also set on state).
     */
    async generate(prompt: string): Promise<void> {
        if (!prompt.trim()) {
            this.error = "Prompt cannot be empty";
            return;
        }
        if (!this.config.apiKey) {
            this.error = "NovelAI API key is not configured";
            return;
        }

        this.isGenerating = true;
        this.error = null;

        try {
            // Dynamic import to avoid pulling in the fetch-heavy module eagerly
            const { generateImage } = await import("@/lib/services/NovelAIService");
            const blob = await generateImage(prompt, { ...this.config });

            // Revoke the previous preview URL to avoid memory leaks
            if (this.previewUrl) {
                URL.revokeObjectURL(this.previewUrl);
            }

            this.generatedImage = blob;
            this.previewUrl = URL.createObjectURL(blob);
            Logger.info("[NovelAI] Image generated successfully");
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.error = message;
            Logger.error("[NovelAI] Generation failed", message);
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * Save the currently generated image as a sticker in the specified pack.
     * Creates a new pack if `packId` is not provided.
     *
     * @param name - Display name for the sticker.
     * @param packId - Optional ID of an existing pack to add the sticker to.
     * @returns The ID of the sticker pack the sticker was saved to.
     */
    async saveToStickers(name: string, packId?: string): Promise<string> {
        const blob = this.generatedImage;
        if (!blob) {
            throw new Error("No generated image to save");
        }

        const adapter = await getStickerAdapter();

        // Determine the pack to add to
        let pack: StickerPack;
        if (packId) {
            const existing = await adapter.getPack(packId);
            if (!existing) {
                throw new Error(`Sticker pack "${packId}" not found`);
            }
            pack = existing;
        } else {
            pack = {
                id: uid(),
                name: "NovelAI Generations",
                description: "Images generated with NovelAI",
                stickers: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }

        // Convert the blob to a base64 data URL for storage
        const dataUrl = await blobToDataUrl(blob);

        const sticker: Sticker = {
            id: uid(),
            name,
            source: "novelai",
            data: dataUrl,
            imageUrl: this.previewUrl ?? undefined,
        };

        pack.stickers = [...pack.stickers, sticker];
        pack.updatedAt = new Date().toISOString();

        await adapter.savePack(pack);
        Logger.info("[NovelAI] Sticker saved to pack", { packId: pack.id, sticker: sticker.id });

        return pack.id;
    }

    /**
     * Validate the current configuration.
     * Returns an error message string, or `null` if valid.
     */
    validate(): string | null {
        if (!this.config.apiKey) {
            return "API key is required";
        }
        if (this.config.width % 64 !== 0) {
            return "Width must be a multiple of 64";
        }
        if (this.config.height % 64 !== 0) {
            return "Height must be a multiple of 64";
        }
        return null;
    }

    /**
     * Reset the generated image and preview URL.
     */
    resetImage(): void {
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
        }
        this.generatedImage = null;
        this.previewUrl = null;
        this.error = null;
    }
}

/**
 * Converts a Blob to a base64 data URL string.
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read blob as data URL"));
        reader.readAsDataURL(blob);
    });
}

export const novelaiStore = new NovelaiStore();
