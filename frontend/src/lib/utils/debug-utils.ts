// frontend/src/utils/debug-utils.ts

import { isDevModeActive } from "../stores/ui";
import { getStorageKey } from "./storageKey";

/**
 * Clears all specified browser storage.
 */
export async function clearAllBrowserData(): Promise<void> {
  console.log("Clearing all browser data...");

  // Clear localStorage, preserving the reset on refresh setting
  const resetOnRefreshKey = "debug-reset-on-refresh";
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key !== resetOnRefreshKey) {
      localStorage.removeItem(key);
    }
  }
  console.log("localStorage cleared, preserving debug settings.");

  // Clear IndexedDB
  const dbName = getStorageKey("PersonaChatDB");
  const request = indexedDB.deleteDatabase(dbName);
  request.onsuccess = () => {
    console.log(`IndexedDB database '${dbName}' deleted.`);
  };
  request.onerror = (event: Event) => {
    console.error(
      `Error deleting IndexedDB database '${dbName}':`,
      (event.target as IDBRequest).error,
    );
  };
  console.log("IndexedDB cleared.");

  // Clear cookies (this is more complex and often requires server-side or specific cookie paths)
  // For client-side, we can try to expire them, but it's not foolproof.
  document.cookie.split(";").forEach((c: string) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  console.log("Attempted to clear cookies.");

  // Unregister service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration: ServiceWorkerRegistration) => {
        const success = await registration.unregister();
        if (success) {
          console.log("Service worker unregistered.");
        } else {
          console.error("Service worker unregistration failed.");
        }
        return success;
      }),
    );
    console.log("Service workers unregistered.");
  }
  console.log("All browser data cleared successfully.");
}

/**
 * Loads pre-configured data into browser storage.
 * @param {string} localStoragePath - Path to the local storage JSON file.
 * @param {string} indexedDBPath - Path to the IndexedDB JSON file.
 */
export async function loadPreconfiguredData(
  localStoragePath: string,
  indexedDBPath: string,
): Promise<void> {
  console.log("Loading pre-configured data...");

  // Load localStorage data
  try {
    const localStorageResponse: Response = await fetch(localStoragePath);
    const contentTypeLS = localStorageResponse.headers.get("content-type");
    if (
      localStorageResponse.ok &&
      contentTypeLS &&
      contentTypeLS.includes("application/json")
    ) {
      const data: { [key: string]: any } = await localStorageResponse.json();
      for (const key in data) {
        localStorage.setItem(key, JSON.stringify(data[key]));
      }
      console.log("localStorage pre-configured data loaded.");
    } else if (localStorageResponse.ok) {
      // Response is ok, but not JSON. Ignore.
    } else {
      console.warn(
        `Could not load localStorage data from ${localStoragePath}:`,
        localStorageResponse.statusText,
      );
    }
  } catch (error: unknown) {
    console.error("Error loading localStorage pre-configured data:", error);
  }

  // IndexedDB data loading
  try {
    const indexedDBResponse: Response = await fetch(indexedDBPath);
    const contentTypeIDB = indexedDBResponse.headers.get("content-type");
    if (
      indexedDBResponse.ok &&
      contentTypeIDB &&
      contentTypeIDB.includes("application/json")
    ) {
      const dbData: {
        [dbName: string]: { data: { key: string; value: any }[] };
      } = await indexedDBResponse.json();

      for (const dbName in dbData) {
        const dataToLoad = dbData[dbName].data;

        if (!dataToLoad || dataToLoad.length === 0) {
          console.warn(`No data found for IndexedDB database '${dbName}'.`);
          continue;
        }

        const request: IDBOpenDBRequest = indexedDB.open(dbName, 1); // Version 1, adjust if needed

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db: IDBDatabase = (event.target as IDBRequest).result;
          // Assuming a single object store named 'data' with 'key' as keyPath
          if (!db.objectStoreNames.contains("data")) {
            db.createObjectStore("data", { keyPath: "key" });
          }
        };

        request.onsuccess = (event: Event) => {
          const db: IDBDatabase = (event.target as IDBRequest).result;
          const transaction: IDBTransaction = db.transaction(
            ["data"],
            "readwrite",
          );
          const objectStore: IDBObjectStore = transaction.objectStore("data");

          dataToLoad.forEach((item) => {
            objectStore.put(item); // Use put to add or update
          });

          transaction.oncomplete = () => {
            console.log(
              `IndexedDB database '${dbName}' loaded with pre-configured data.`,
            );
            db.close();
          };
          transaction.onerror = (transactionEvent: Event) => {
            console.error(
              `Transaction error for '${dbName}':`,
              (transactionEvent.target as IDBRequest).error,
            );
            db.close();
          };
        };

        request.onerror = (event: Event) => {
          console.error(
            `Error opening IndexedDB database '${dbName}':`,
            (event.target as IDBRequest).error,
          );
        };
      }
    } else if (indexedDBResponse.ok) {
      // Response is ok, but not JSON. Ignore.
    } else {
      console.warn(
        `Could not load IndexedDB data from ${indexedDBPath}:`,
        indexedDBResponse.statusText,
      );
    }
  } catch (error) {
    console.error("Error loading IndexedDB pre-configured data:", error);
  }

  console.log("Pre-configured data loading complete.");
}

/**
 * Initializes the debug utility in development mode.
 * When running in a development environment (import.meta.env.DEV is true),
 * this function automatically clears all browser data and loads pre-configured data.
 */
export async function initializeDebugUtility(): Promise<void> {
  // Check if in development mode and if a debug flag is set (e.g., via localStorage or another env variable)
  // For now, we'll just use import.meta.env.DEV
  if (import.meta.env.DEV) {
    isDevModeActive.set(true);
    console.log("Debug mode activated in development environment.");
  }
}
