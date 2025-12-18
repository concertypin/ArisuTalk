import type {
    ICharacterStorageAdapter,
    IChatStorageAdapter,
    IPersonaStorageAdapter,
    ISettingsStorageAdapter,
} from "@/lib/interfaces";

/**
 * Storage resolver that provides the appropriate storage adapters.
 * Uses dynamic imports for tree-shaking and code splitting.
 * Defaults to IndexedDB (Dexie) for production use.
 * Uses localStorage for testing environments.
 */
export class StorageResolver {
    private static characterAdapter: ICharacterStorageAdapter | null = null;
    private static chatAdapter: IChatStorageAdapter | null = null;
    private static personaAdapter: IPersonaStorageAdapter | null = null;
    private static settingsAdapter: ISettingsStorageAdapter | null = null;

    /**
     * Get the character storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getCharacterAdapter(): Promise<ICharacterStorageAdapter> {
        if (this.characterAdapter) {
            return this.characterAdapter;
        }
        let adapterPromise: Promise<{ default: new () => ICharacterStorageAdapter }>;
        if (import.meta.env.VITEST) {
            // Use localStorage adapter in testing environment
            adapterPromise = import("./character/LocalStorageCharacterAdapter");
        } else {
            adapterPromise = import("./character/IDBCharacterAdapter");
        }
        this.characterAdapter = new (await adapterPromise).default();
        return this.characterAdapter;
    }

    /**
     * Get the chat storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getChatAdapter(): Promise<IChatStorageAdapter> {
        if (this.chatAdapter) {
            return this.chatAdapter;
        }
        let adapterPromise: Promise<{ default: new () => IChatStorageAdapter }>;
        if (import.meta.env.VITEST) {
            // Use localStorage adapter in testing environment
            adapterPromise = import("./chat/LocalStorageChatAdapter");
        } else {
            adapterPromise = import("./chat/IDBChatAdapter");
        }
        this.chatAdapter = new (await adapterPromise).default();
        return this.chatAdapter;
    }

    /**
     * Get the persona storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getPersonaAdapter(): Promise<IPersonaStorageAdapter> {
        if (this.personaAdapter) {
            return this.personaAdapter;
        }

        let adapterPromise: Promise<{ default: new () => IPersonaStorageAdapter }>;
        if (import.meta.env.VITEST) {
            // Use localStorage adapter in testing environment
            adapterPromise = import("./persona/LocalStoragePersonaAdapter");
        } else {
            adapterPromise = import("./persona/IDBPersonaAdapter");
        }
        this.personaAdapter = new (await adapterPromise).default();
        return this.personaAdapter;
    }

    /**
     * Get the settings storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getSettingsAdapter(): Promise<ISettingsStorageAdapter> {
        if (this.settingsAdapter) {
            return this.settingsAdapter;
        }

        let adapterPromise: Promise<{ default: new () => ISettingsStorageAdapter }>;
        if (import.meta.env.VITEST) {
            // Use localStorage adapter in testing environment
            adapterPromise = import("./settings/LocalStorageSettingsAdapter");
        } else {
            adapterPromise = import("./settings/IDBSettingsAdapter");
        }
        this.settingsAdapter = new (await adapterPromise).default();
        return this.settingsAdapter;
    }

    /**
     * Reset all adapters (useful for testing).
     */
    static reset(): void {
        this.characterAdapter = null;
        this.chatAdapter = null;
        this.personaAdapter = null;
        this.settingsAdapter = null;
    }
}
