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
        if (!this.characterAdapter) {
            const { DexieCharacterAdapter: IDBCharacterAdapter } =
                await import("./character/IDBCharacterAdapter");
            this.characterAdapter = new DexieCharacterAdapter();
        }
        return this.characterAdapter;
    }

    /**
     * Get the chat storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getChatAdapter(): Promise<IChatStorageAdapter> {
        if (!this.chatAdapter) {
            const { DexieChatAdapter: IDBChatAdapter } = await import("./chat/IDBChatAdapter");
            this.chatAdapter = new DexieChatAdapter();
        }
        return this.chatAdapter;
    }

    /**
     * Get the persona storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getPersonaAdapter(): Promise<IPersonaStorageAdapter> {
        if (!this.personaAdapter) {
            const { DexiePersonaAdapter: IDBPersonaAdapter } =
                await import("./persona/IDBPersonaAdapter");
            this.personaAdapter = new DexiePersonaAdapter();
        }
        return this.personaAdapter;
    }

    /**
     * Get the settings storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getSettingsAdapter(): Promise<ISettingsStorageAdapter> {
        if (!this.settingsAdapter) {
            const { DexieSettingsAdapter: IDBSettingsAdapter } =
                await import("./settings/IDBSettingsAdapter");
            this.settingsAdapter = new DexieSettingsAdapter();
        }
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
