import type { IAssetStorageAdapter } from "@/lib/interfaces";
import { opfsAdapter } from "./OpFSAssetStorageAdapter";

/**
 * Returns the best available asset storage adapter.
 * Currently returns OpFS adapter, but extensible for future protocols.
 *
 * @returns The asset storage adapter to use
 */
export function getAssetStorage(): IAssetStorageAdapter {
    return opfsAdapter;
}
