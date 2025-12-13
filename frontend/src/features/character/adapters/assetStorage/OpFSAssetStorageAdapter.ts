import type { IfNotExistBehavior } from "@/lib/interfaces/IAssetStorageAdapter";
import type IAssetStorageAdapter from "@/lib/interfaces/IAssetStorageAdapter";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class OpFSAssetStorageAdapter implements IAssetStorageAdapter {
    async init(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async saveAsset(id: string, data: File, overwrite?: boolean): Promise<string> {
        throw new Error("Method not implemented.");
    }
    async getAssetUrl<T extends IfNotExistBehavior | undefined>(
        id: string,
        ifNotExist?: T
    ): Promise<string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        throw new Error("Method not implemented.");
    }
    async getAssetBlob<T extends IfNotExistBehavior | undefined = undefined>(
        id: string,
        ifNotExist?: T
    ): Promise<Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        throw new Error("Method not implemented.");
    }
}
export default OpFSAssetStorageAdapter;
