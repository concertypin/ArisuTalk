import { IfNotExistBehavior } from "@/lib/interfaces/IAssetStorageAdapter";
import type IAssetStorageAdapter from "@/lib/interfaces/IAssetStorageAdapter";

const FORBIDDEN_CHARS = new Set(["<", ">", ":", '"', "/", "\\", "|", "?", "*"]);
const RESERVED_NAMES = new Set([
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "COM0",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
    "LPT0",
]);

function sanitizeFileName(originalName: string, replacement: string = "_"): string {
    const trimmedName = originalName.trim();

    if (!trimmedName) return "untitled_file";

    let safeName = "";

    for (const char of trimmedName) {
        const code = char.codePointAt(0);
        const isControlChar = code !== undefined && code < 32;

        if (FORBIDDEN_CHARS.has(char) || isControlChar) safeName += replacement;
        else safeName += char;
    }

    if (RESERVED_NAMES.has(safeName.toUpperCase())) {
        safeName = `${replacement}${safeName}`;
    }

    if (safeName === "." || safeName === "..") {
        safeName = `${replacement}${safeName}`;
    }

    while (safeName.length > 0 && (safeName.endsWith(".") || safeName.endsWith(" "))) {
        safeName = safeName.slice(0, -1);
    }

    if (safeName.length === 0) {
        safeName = "untitled_file";
    }

    if (safeName.length > 255) {
        safeName = safeName.substring(0, 255);
    }

    return safeName;
}
type ValidID = URL & { protocol: "local:"; hostname: "opfs"; host: "opfs" };
export class OpFSAssetStorageAdapter implements IAssetStorageAdapter {
    /**
     * Promise of the root directory handle of OpFS.
     * When accessing it, just await it. It will be initialized on class creation and (mostly) already fulfilled.
     */
    private readonly root: Promise<FileSystemDirectoryHandle> = navigator.storage.getDirectory();

    async init(): Promise<void> {
        //no-op, already initialized on class creation
    }

    private checkValidId(id: URL): asserts id is ValidID {
        if (id.protocol !== "local:") throw new Error("Invalid ID");
        if (id.hostname !== "opfs") throw new Error("Invalid ID");
        if (id.host !== "opfs") throw new Error("Invalid ID");
    }
    async saveAsset(name: string, data: File, overwrite?: boolean): Promise<URL> {
        const root = await this.root;
        // Simple mapping: Store directly in root with name as filename.
        // if create is false, throws if not exists. (NotFoundError on DOMException)
        const fileHandle = await root.getFileHandle(sanitizeFileName(name), { create: overwrite });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
        return new URL(name, "local://opfs/");
    }

    async getAssetUrl<T extends IfNotExistBehavior | undefined>(
        id: URL,
        ifNotExist?: T
    ): Promise<string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        // Returns browser-usable URL. Not internal one like local://.

        const blob = await this.getAssetBlob(id, ifNotExist);
        if (!blob) {
            if ((ifNotExist ?? IfNotExistBehavior.THROW_ERROR) === IfNotExistBehavior.RETURN_NULL)
                // We'll use evil here
                // Typescript doesn't allow us to return null even if it's possible
                return null as string | (T extends IfNotExistBehavior.RETURN_NULL ? null : never);
            throw new Error("Asset not found");
        }
        return URL.createObjectURL(blob);
    }

    async getAssetBlob<T extends IfNotExistBehavior | undefined = undefined>(
        id: URL,
        ifNotExist?: T
    ): Promise<Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never)> {
        type ReturnInnerType = Blob | (T extends IfNotExistBehavior.RETURN_NULL ? null : never);
        this.checkValidId(id);
        const root = await this.root;

        try {
            // Strip scheme if present
            const filename = id.pathname.replace("/", "");
            const fileHandle = await root.getFileHandle(filename, { create: false });
            const file = await fileHandle.getFile();
            return file;
        } catch (e) {
            // Evil cast
            // Typescript doesn't allow us to return null even if it's possible
            if (ifNotExist === IfNotExistBehavior.RETURN_NULL) return null as ReturnInnerType;
            throw e;
        }
    }
}
export default OpFSAssetStorageAdapter;
