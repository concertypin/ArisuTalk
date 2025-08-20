import { t } from './i18n.js'; // Adjust the path as needed for your project

export async function loadFromBrowserStorage(key, defaultValue) {
  try {
    const value = await loadFromIndexedDB(key);
    if (value !== null) {
      return value;
    }
  } catch (error) {
    console.warn(`Error reading from IndexedDB key "${key}":`, error);
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export async function saveToBrowserStorage(key, value) {
  try {
    await saveToIndexedDB(key, value);
  } catch (error) {
    console.error(`Error saving to IndexedDB key "${key}":`, error);
    try {
      const stringifiedValue = JSON.stringify(value);
      window.localStorage.setItem(key, stringifiedValue);
    } catch (localStorageError) {
      console.error("localStorage fallback also failed:", localStorageError);
      alert(t('modal.saveFailed.message'));
    }
  }
}

export async function loadFromIndexedDB(key) {
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
      const db = event.target.result;
      if (!db.objectStoreNames.contains("data")) {
        db.createObjectStore("data", { keyPath: "key" });
      }
    };
  });
}

export async function saveToIndexedDB(key, value) {
  return new Promise((resolve, reject) => {
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
      const db = event.target.result;
      if (!db.objectStoreNames.contains("data")) {
        db.createObjectStore("data", { keyPath: "key" });
      }
    };
  });
}

export function getLocalStorageUsage() {
  const appKeys = [
    "personaChat_settings_v16",
    "personaChat_characters_v16",
    "personaChat_messages_v16",
    "personaChat_unreadCounts_v16",
    "personaChat_chatRooms_v16",
    "personaChat_userStickers_v16",
  ];

  let totalSize = 0;
  for (const key of appKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      totalSize += value.length + key.length;
    }
  }
  return totalSize;
}

export function getLocalStorageFallbackUsage(newData = "", existingKey = "") {
  const appKeys = [
    "personaChat_settings_v16",
    "personaChat_characters_v16",
    "personaChat_messages_v16",
    "personaChat_unreadCounts_v16",
    "personaChat_chatRooms_v16",
    "personaChat_userStickers_v16",
  ];

  let currentAppUsage = 0;
  for (const key of appKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      currentAppUsage += value.length + key.length;
    }
  }

  let existingSize = 0;
  if (existingKey) {
    const existing = localStorage.getItem(existingKey);
    if (existing) {
      existingSize = existing.length;
    }
  }

  const newDataSize = newData.length;
  const totalAfterAdd = currentAppUsage - existingSize + newDataSize;

  const warningLimit = 5 * 1024 * 1024; // 5MB

  if (totalAfterAdd > warningLimit) {
    const currentFormatted = formatBytes(currentAppUsage);
    const totalFormatted = formatBytes(totalAfterAdd);
    return {
      canSave: false,
      current: currentFormatted,
      total: totalFormatted,
    };
  }

  return { canSave: true };
}

export function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
