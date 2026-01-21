/**
 * Debug script to test export/import round-trip
 * Run in browser console: import("@/debug-export.ts")
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

async function debugExportImport() {
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

    Logger.info("📤 Exporting character...");
    const result = await worker.exportCharacter(transfer(charCopy, transferables));
    Logger.info("📦 Export result:", { byteLength: result.byteLength });

    // Check first few bytes
    const uint8View = new Uint8Array(result);
    Logger.info(
        "📊 First 16 bytes:",
        Array.from(uint8View.slice(0, 16))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ")
    );

    // Try to parse it back
    Logger.info("📥 Parsing exported data...");
    const parseResult = await worker.parseCharacter(result);

    if (parseResult.success) {
        Logger.info("✅ Round-trip successful!", {
            id: parseResult.data.id,
            name: parseResult.data.name,
        });
    } else {
        Logger.error("❌ Round-trip failed!", { error: parseResult.error });
    }

    return { exportedBytes: result, parseResult };
}

void debugExportImport();
