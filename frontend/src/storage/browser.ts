import { t } from "../i18n";
import { StorageBackend, StorageQuota } from "./storage";

export class IndexedDBStorage extends StorageBackend {
    async load(key: string, defaultValue: any | null): Promise<any> {
        try {
            const value = await this.loadFromIndexedDB(key);
            return value !== null ? value : defaultValue;
        } catch (error) {
            console.error(`Error reading from IndexedDB key "${key}":`, error);
            return defaultValue;
        }
    }
    async save(key: string, value: any): Promise<void> {
        this.saveToIndexedDB(key, value).catch((error) => {
            console.error(`Error saving to IndexedDB key "${key}":`, error);
            // 중요한 데이터 손실 방지를 위해 사용자에게 알림
            setTimeout(() => {
                alert(t("modal.saveFailed.message"));
            }, 100);
        });
    }
    async checkQuotaNumeric(newData: string = "", existingKey: string = ""): Promise<StorageQuota<number>> {
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
                        current: used,
                        total: quota,
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

    async getUsage() {
        let totalSize = 0;
        for (const key of this.appKeys) {
            try {
                const value = await this.loadFromIndexedDB(key);
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


    private async saveToIndexedDB(key: string, value: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const dbName = "PersonaChatDB";
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
    private async loadFromIndexedDB(key: string) {
        return new Promise((resolve, reject) => {
            const dbName = "PersonaChatDB";
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
}


