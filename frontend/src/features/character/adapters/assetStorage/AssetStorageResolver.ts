import type { IAssetStorageAdapter } from "@/lib/interfaces";
import { opfsAdapter } from "./OpFSAssetStorageAdapter";
import { ServerAssetStorageAdapter } from "./ServerAssetStorageAdapter";

export class AssetStorageResolver {
    private static serverAdapter: ServerAssetStorageAdapter | null = null;

    static getAdapter(): IAssetStorageAdapter {
        // Check for cookie
        if (typeof document !== "undefined" && document.cookie.includes("useServerStorage=true")) {
            if (!this.serverAdapter) {
                this.serverAdapter = new ServerAssetStorageAdapter();
            }
            return this.serverAdapter;
        }
        return opfsAdapter;
    }
}
