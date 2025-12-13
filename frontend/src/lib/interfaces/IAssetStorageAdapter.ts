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
/**
 * URL that can be used to access the asset from the browser.
 * Usually created by `URL.createObjectURL`.
 */
type BrowsableURL = string;

/**
 * URL that points to the file
 * Not accessible from the browser.
 * {@link URL.protocol}: `local:`
 * {@link URL.host}: Different for each adapter. OpFS is `opfs` and so on.
 * {@link URL.pathname}: Path to the file. It varies by adapter.
 */
type FilePointerURL = URL;
/**
 * Interface for asset storage adapters.
 * Defines methods for saving and retrieving assets.
 *
 * This defines two identifiers:
 * - `name`: Unique name for the asset. It may be any string. This is not required to be sanitized. But assets is inaccessible with name.
 * - `id`: {@link FilePointerURL}
 * - `url`: {@link BrowsableURL}
 */
export interface IAssetStorageAdapter {
    /** Initialize the storage adapter. */
    init(): Promise<void>;

    /**
     * Save an asset to storage.
     * @param name - Unique name for the asset. It may be any string.
     * @param data - Binary data of the asset.
     * @param overwrite - Whether to overwrite if the asset already exists. Defaults to false.
     * @returns The URL or identifier of the saved asset. Usually `local://bindingName/*`.
     * @throws Error if the asset already exists and overwrite is false.
     */
    saveAsset(name: string, data: File, overwrite?: boolean): Promise<URL>;

    /**
     * Retrieve an asset from storage.
     * Returns a URL object pointing to the asset data.
     * Doesn't load the entire asset into memory.
     * @param id - URL object for the asset data. `local://` prefix is required.
     * @param ifNotExist - Behavior if the asset does not exist. Defaults to throwing an error.
     * @returns URL object for the asset data. It's accessible from the browser. Different from `local://bindingName/*`.
     * @throws Error if the asset does not exist and ifNotExist is set to THROW_ERROR.
     */
    getAssetUrl<T extends IfNotExistBehavior | undefined = undefined>(
        id: FilePointerURL,
        ifNotExist?: T
    ): Promise<BrowsableURL | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)>;

    /**
     * Retrieve the raw Blob data of an asset from storage.
     * @param id - URL object for the asset data. It's accessible from the browser. Different from `local://bindingName/*`.
     * @param ifNotExist - Behavior if the asset does not exist. Defaults to throwing an error.
     * @returns Blob data of the asset.
     * @throws Error if the asset does not exist and ifNotExist is set to THROW_ERROR.
     */
    getAssetBlob<T extends IfNotExistBehavior | undefined = undefined>(
        id: FilePointerURL,
        ifNotExist?: T
    ): Promise<Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)>;
}
export default IAssetStorageAdapter;
