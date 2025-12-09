// frontend/src/utils/dev-tools.ts

/**
 * Dumps all localStorage data to a JSON string.
 * @returns {string} JSON string of localStorage data.
 */
export function dumpLocalStorageToJson(): string {
	const localStorageData: { [key: string]: any } = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			try {
				localStorageData[key] = JSON.parse(localStorage.getItem(key) || "null");
			} catch (e) {
				localStorageData[key] = localStorage.getItem(key);
			}
		}
	}
	const jsonOutput = JSON.stringify(localStorageData, null, 2);
	console.log("localStorage data dumped:\n", jsonOutput);
	return jsonOutput;
}

/**
 * Dumps all IndexedDB data to a JSON string.
 * This is a generic script and might need adjustments based on the specific IndexedDB structure.
 * @returns {Promise<string | null>} JSON string of IndexedDB data, or null if an error occurs.
 */
export async function dumpIndexedDBToJson(): Promise<string | null> {
	const indexedDBData: { [dbName: string]: { [storeName: string]: any[] } } =
		{};

	async function dumpDatabase(dbName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const request: IDBOpenDBRequest = indexedDB.open(dbName);
			request.onsuccess = (event: Event) => {
				const db: IDBDatabase = (event.target as IDBRequest).result;
				indexedDBData[dbName] = {};

				const transaction: IDBTransaction = db.transaction(
					Array.from(db.objectStoreNames),
					"readonly",
				);
				transaction.oncomplete = () => {
					db.close();
					resolve();
				};
				transaction.onerror = (event: Event) => {
					console.error(
						`Transaction error for ${dbName}:`,
						(event.target as IDBRequest).error,
					);
					db.close();
					reject((event.target as IDBRequest).error);
				};

				for (const storeName of Array.from(db.objectStoreNames)) {
					indexedDBData[dbName][storeName] = [];
					const objectStore: IDBObjectStore =
						transaction.objectStore(storeName);
					objectStore.openCursor().onsuccess = (event: Event) => {
						const cursor: IDBCursorWithValue = (event.target as IDBRequest)
							.result;
						if (cursor) {
							indexedDBData[dbName][storeName].push(cursor.value);
							cursor.continue();
						}
					};
				}
			};
			request.onerror = (event: Event) => {
				console.error(
					`Error opening IndexedDB database ${dbName}:`,
					(event.target as IDBRequest).error,
				);
				reject((event.target as IDBRequest).error);
			};
		});
	}

	try {
		const databases: IDBDatabaseInfo[] = await indexedDB.databases();
		const dumpPromises = databases.map((db) =>
			db.name ? dumpDatabase(db.name) : Promise.resolve(),
		);
		await Promise.all(dumpPromises);
		const jsonOutput = JSON.stringify(indexedDBData, null, 2);
		console.log("IndexedDB data dumped:\n", jsonOutput);
		return jsonOutput;
	} catch (error: unknown) {
		console.error("Error dumping IndexedDB:", error);
		return null;
	}
}
