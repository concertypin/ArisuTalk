import { t } from "$root/i18n";
import { getStorageKey } from "./lib/utils/storageKey";

interface IndexedDBItem {
    key: string;
    value: any;
}

interface StorageQuota {
    canSave: boolean;
    current?: string;
    total?: string;
}

export async function loadFromBrowserStorage<T>(
    key: string,
    defaultValue: T,
): Promise<T> {
    try {
        const value = await loadFromIndexedDB(key);
        return value !== null ? value : defaultValue;
    } catch (error) {
        console.error(`Error reading from IndexedDB key "${key}":`, error);
        return defaultValue;
    }
}

export async function saveToBrowserStorage(
    key: string,
    value: any,
): Promise<void> {
    try {
        await saveToIndexedDB(key, value);
    } catch (error) {
        console.error(`Error saving to IndexedDB key "${key}":`, error);
        // 중요한 데이터 손실 방지를 위해 사용자에게 알림
        setTimeout(() => {
            alert(t("modal.saveFailed.message"));
        }, 100);
        // 에러를 다시 던져서 호출한 쪽에서 인지할 수 있도록 함
        throw error;
    }
}

export async function loadFromIndexedDB(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const dbName = getStorageKey("PersonaChatDB");
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(["data"], "readonly");
            const store = transaction.objectStore("data");
            const getRequest = store.get(key);

            getRequest.onsuccess = () => {
                const result = getRequest.result;
                resolve(result ? result.value : null);
            };

            getRequest.onerror = () => reject(getRequest.error);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("data")) {
                db.createObjectStore("data", { keyPath: "key" });
            }
        };
    });
}
/**
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function saveToIndexedDB(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const dbName = getStorageKey("PersonaChatDB");
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(["data"], "readwrite");
            const store = transaction.objectStore("data");

            store.put({ key, value });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains("data")) {
                db.createObjectStore("data", { keyPath: "key" });
            }
        };
    });
}

export async function getIndexedDBUsage(): Promise<number> {
    const appKeys = [
        "personaChat_settings_v16",
        "personaChat_characters_v16",
        "personaChat_messages_v16",
        "personaChat_unreadCounts_v16",
        "personaChat_chatRooms_v16",
        "personaChat_groupChats_v16",
        "personaChat_openChats_v16",
        "personaChat_characterStates_v16",
        "personaChat_userStickers_v16",
        "personaChat_personaData_v16",
    ];

    let totalSize = 0;
    for (const key of appKeys) {
        try {
            const value = await loadFromIndexedDB(key);
            if (value) {
                const stringified = JSON.stringify(value);
                totalSize += stringified.length + key.length;
            }
        } catch (error) {
            console.warn(`Error getting size for key "${key}":`, error);
        }
    }
    return totalSize;
}

export async function checkIndexedDBQuota(
    newData: string = "",
    existingKey: string = "",
): Promise<StorageQuota> {
    // IndexedDB는 일반적으로 수 GB의 용량을 지원하므로 용량 체크를 단순화
    try {
        if ("storage" in navigator && "estimate" in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage || 0;
            const quota = estimate.quota || 1024 * 1024 * 1024; // 기본 1GB

            // Safari Mobile 1GB 제한 고려, 500MB 이상 사용시 경고
            const safeLimit = 500 * 1024 * 1024; // 500MB
            if (used > safeLimit || used / quota > 0.8) {
                return {
                    canSave: false,
                    current: formatBytes(used),
                    total: formatBytes(quota),
                };
            }
        }

        // 기본적으로 저장 허용
        return { canSave: true };
    } catch (error) {
        console.warn("Storage quota check failed:", error);
        return { canSave: true };
    }
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
