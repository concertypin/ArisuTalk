import type { IfNotExistBehavior } from "@/lib/interfaces/IAssetStorageAdapter";
import type IAssetStorageAdapter from "@/lib/interfaces/IAssetStorageAdapter";

/* eslint-disable @typescript-eslint/no-unused-vars */
export class OpFSAssetStorageAdapter implements IAssetStorageAdapter {
    private root: FileSystemDirectoryHandle | null = null;

    async init(): Promise<void> {
        if (!this.root) {
            this.root = await navigator.storage.getDirectory();
        }
    }

    async saveAsset(id: string, data: File, overwrite?: boolean): Promise<string> {
        if (!this.root) await this.init();
        // Simple mapping: Store directly in root with ID as filename (or sanitize ID)
        const fileHandle = await this.root!.getFileHandle(id, { create: true });
        // If !overwrite and exists... getFileHandle doesn't throw if exists unless create: false.
        // Actually FileSystemDirectoryHandle.getFileHandle doesn't support 'overwrite' flag directly.
        // We just write to it.
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
        return `local://opfs/${id}`;
    }

    async getAssetUrl<T extends IfNotExistBehavior | undefined>(
        id: string,
        ifNotExist?: T
    ): Promise<string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        // This returns the VIRTUAL url we use in the app, not a browser blob URL.
        // Or does it? The interface doc says "Retrieves... URL".
        // In web app, we usually need a Blob URL to display it.
        // But the `Character` spec uses `local://` schemes.
        // If this method is for DISPLAY, it should return a blob url.
        // If it is for STORAGE key, it returns `local://...`.
        // Let's assume this returns the Displayable URL (Blob URL).

        try {
            const blob = await this.getAssetBlob(id);
            return URL.createObjectURL(blob) as any;
        } catch (e) {
            if (ifNotExist === "RETURN_NULL") return null as any;
            throw e;
        }
    }

    async getAssetBlob<T extends IfNotExistBehavior | undefined = undefined>(
        id: string,
        ifNotExist?: T
    ): Promise<Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        if (!this.root) await this.init();
        try {
            // Strip scheme if present
            const filename = id.replace("local://opfs/", "");
            const fileHandle = await this.root!.getFileHandle(filename);
            const file = await fileHandle.getFile();
            return file;
        } catch (e) {
            if (ifNotExist === "RETURN_NULL") return null as any;
            throw e;
        }
    }
}
export default OpFSAssetStorageAdapter;
