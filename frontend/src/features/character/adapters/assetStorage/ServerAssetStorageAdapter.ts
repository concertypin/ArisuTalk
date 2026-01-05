import { IfNotExistBehavior, type IAssetStorageAdapter } from "@/lib/interfaces";

const BASE_URL = "http://localhost:3000";

export class ServerAssetStorageAdapter implements IAssetStorageAdapter {
    async init(): Promise<void> {
        // No-op
    }

    async saveAsset(name: string, data: File, overwrite?: boolean): Promise<URL> {
        const formData = new FormData();
        formData.append("file", data);
        if (name) formData.append("name", name);
        if (overwrite) formData.append("overwrite", "true");

        const res = await fetch(`${BASE_URL}/assets`, {
            method: "POST",
            body: formData,
        });

        if (res.status === 409 && !overwrite) {
            throw new Error("File already exists");
        }

        if (!res.ok) {
            throw new Error(`Failed to save asset: ${res.statusText}`);
        }

        const json = (await res.json()) as { id: string };
        // Assuming server returns { "id": "local://server/filename.ext" }
        return new URL(json.id);
    }

    async getAssetUrl<T extends IfNotExistBehavior | undefined>(
        id: URL,
        ifNotExist?: T
    ): Promise<string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        // Construct URL to fetch the asset
        // If ID is local://server/filename.ext, we map it to http://localhost:3000/assets/filename.ext
        // But the server API spec says GET /assets/:filename
        // We need to extract filename from id
        const filename = id.pathname.split("/").pop();
        if (!filename) throw new Error("Invalid asset ID");

        const url = `${BASE_URL}/assets/${filename}`;

        // Check if it exists first?
        // Or simply return the URL? The interface says returns "URL object ... accessible from the browser".
        // If it's a blob URL, we download and create it.
        // If we can return a direct http URL, that's better, but the interface usually implies a blob url or something usable.
        // Wait, `getAssetUrl` returns `BrowsableURL` (string).
        // If the server serves static files, we can just return the HTTP URL!
        // But we need to handle `ifNotExist`.

        try {
            const res = await fetch(url, { method: "HEAD" });
            if (res.status === 404) {
                if (ifNotExist === IfNotExistBehavior.RETURN_NULL) {
                    return null as
                        | string
                        | (T extends IfNotExistBehavior.RETURN_NULL ? null : never);
                }
                throw new Error("Asset not found");
            }
        } catch (e) {
            if (ifNotExist === IfNotExistBehavior.RETURN_NULL) {
                return null as string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never);
            }
            throw e;
        }

        return url;
    }

    async getAssetBlob<T extends IfNotExistBehavior | undefined = undefined>(
        id: URL,
        ifNotExist?: T
    ): Promise<Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        const filename = id.pathname.split("/").pop();
        if (!filename) throw new Error("Invalid asset ID");
        const url = `${BASE_URL}/assets/${filename}`;

        const res = await fetch(url);
        if (res.status === 404) {
            if (ifNotExist === IfNotExistBehavior.RETURN_NULL) {
                return null as Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never);
            }
            throw new Error("Asset not found");
        }
        if (!res.ok) throw new Error(`Failed to fetch asset: ${res.statusText}`);
        return res.blob();
    }
}
