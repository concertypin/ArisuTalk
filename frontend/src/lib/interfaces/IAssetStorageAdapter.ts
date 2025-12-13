/**
 * Interface for asset storage adapters.
 * Defines methods for saving and retrieving assets.
 */
export const enum IfNotExistBehavior {
    /**
     * Throw an error if the asset does not exist.
     */
    THROW_ERROR,
    /**
     * Return null if the asset does not exist.
     */
    RETURN_NULL,
}

export interface IAssetStorageAdapter {
    /** Initialize the storage adapter. */
    init(): Promise<void>;

    /**
     * Save an asset to storage.
     * @param id - Unique identifier for the asset.
     * @param data - Binary data of the asset.
     * @param overwrite - Whether to overwrite if the asset already exists. Defaults to false.
     * @returns The URL or identifier of the saved asset.
     * @throws Error if the asset already exists and overwrite is false.
     */
    saveAsset(id: string, data: File, overwrite?: boolean): Promise<string>;

    /**
     * Retrieve an asset from storage.
     * Returns a URL object pointing to the asset data.
     * Doesn't load the entire asset into memory.
     * @param id - Unique identifier for the asset.
     * @param ifNotExist - Behavior if the asset does not exist. Defaults to throwing an error.
     * @returns URL object for the asset data.
     * @throws Error if the asset does not exist and ifNotExist is set to THROW_ERROR.
     */
    getAssetUrl<T extends IfNotExistBehavior | undefined = undefined>(
        id: string,
        ifNotExist?: T
    ): Promise<string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)>;

    /**
     * Retrieve the raw Blob data of an asset from storage.
     * @param id - Unique identifier for the asset.
     * @param ifNotExist - Behavior if the asset does not exist. Defaults to throwing an error.
     * @returns Blob data of the asset.
     * @throws Error if the asset does not exist and ifNotExist is set to THROW_ERROR.
     */
    getAssetBlob<T extends IfNotExistBehavior | undefined = undefined>(
        id: string,
        ifNotExist?: T
    ): Promise<Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)>;
}
export default IAssetStorageAdapter;
