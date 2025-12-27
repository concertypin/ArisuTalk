import type { AssetEntity } from "@arisutalk/character-spec/v0/Character/Assets";
import type { IAssetStorageAdapter } from "@/lib/interfaces";

/**
 * Converts a Blob to a Uint8Array.
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array<ArrayBuffer>> {
    const buffer = await blob.arrayBuffer();
    return new Uint8Array(buffer);
}

/**
 * Remaps an asset to use Uint8Array for its data.
 * Handles various formats: Uint8Array (passthrough), remote URLs (passthrough),
 * local files (fetch and convert), and data URLs (decode base64).
 *
 * @param asset - The asset to remap
 * @param assetStorage - The asset storage adapter for fetching local files
 * @returns The asset with data as Uint8Array (or original string for URLs)
 */
export async function remapAssetToUint8Array(
    asset: AssetEntity,
    assetStorage: IAssetStorageAdapter
): Promise<AssetEntity> {
    // Already Uint8Array, leave as is
    if (asset.data instanceof Uint8Array) {
        return asset;
    }

    // Remote URL, leave as is
    if (asset.data.startsWith("http:") || asset.data.startsWith("https:")) {
        return asset;
    }

    // Local file, read as Uint8Array
    if (asset.data.startsWith("local:")) {
        try {
            await assetStorage.init();
            const blob = await assetStorage.getAssetBlob(new URL(asset.data));
            const uint8Array = await blobToUint8Array(blob);
            return { ...asset, data: uint8Array };
        } catch (e) {
            console.error("Failed to fetch local file for export:", asset.data, e);
            throw e instanceof Error ? e : new Error(String(e));
        }
    }

    // data: URL (base64), convert to Uint8Array
    if (asset.data.startsWith("data:")) {
        try {
            const commaIndex = asset.data.indexOf(",");
            if (commaIndex === -1) {
                console.warn(
                    "Malformed data URL (no comma), leaving as is:",
                    asset.data.slice(0, 50)
                );
                return asset;
            }
            const base64 = asset.data.slice(commaIndex + 1);
            const binaryString = atob(base64);
            const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
            return { ...asset, data: bytes };
        } catch (e) {
            console.error("Failed to decode base64 data URL:", e);
            return asset; // Leave as is on error
        }
    }

    // Unknown format, leave as is
    return asset;
}

/**
 * Collects all ArrayBuffers from Uint8Array assets for transfer.
 * Used with Comlink's transfer() for zero-copy worker communication.
 *
 * @param assets - Array of assets to collect buffers from
 * @returns Array of ArrayBuffers from Uint8Array assets
 */
export function collectTransferableBuffers(assets: AssetEntity[]): ArrayBufferLike[] {
    return assets
        .filter((a): a is AssetEntity & { data: Uint8Array } => a.data instanceof Uint8Array)
        .map((a) => a.data.buffer);
}
