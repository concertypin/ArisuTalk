import { IndexedDBStorage } from "./browser";
import { StorageBackend } from "./storage";

let storageInstance: StorageBackend | null = null;
export function getStorage(): StorageBackend {
    if (storageInstance) {
        return storageInstance;
    }
    return storageInstance = new IndexedDBStorage();
}

export default getStorage();