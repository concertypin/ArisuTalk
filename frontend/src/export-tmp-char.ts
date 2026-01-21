/**
 * Temporary script to export the character defined in tmp.ts to .arisc file
 * Run this in browser console after importing both files
 */

import { getCardParseWorker } from "@/lib/workers/workerClient";
import { transfer } from "comlink";
import {
    remapAssetToUint8Array,
    collectTransferableBuffers,
} from "@/features/character/utils/assetEncoding";
import { OpFSAssetStorageAdapter } from "@/features/character/adapters/assetStorage/OpFSAssetStorageAdapter";
import { char } from "./tmp";
import { cloneDeep } from "lodash-es";
import type { Character } from "@arisutalk/character-spec/v0/Character";
import { Logger } from "@common/logger/Logger";

async function exportCharacter() {
    const worker = await getCardParseWorker();

    // Clone the character to avoid mutations
    const charCopy: Character = cloneDeep(char);

    // Remap all assets to use Uint8Array for binary data
    const assetStorage = new OpFSAssetStorageAdapter();
    const newAssets = await Promise.all(
        charCopy.assets.assets.map((asset) => remapAssetToUint8Array(asset, assetStorage))
    );
    charCopy.assets.assets = newAssets;

    // Collect all ArrayBuffers from Uint8Array assets for transfer (zero-copy)
    const transferables = collectTransferableBuffers(newAssets);
    const result = await worker.exportCharacter(transfer(charCopy, transferables));

    // Convert to Blob if needed
    const blob = new Blob([result], { type: "application/octet-stream" });
    // Download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${charCopy.name || "character"}.arisc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    Logger.info("✅ Character exported successfully!");
}
void exportCharacter();
