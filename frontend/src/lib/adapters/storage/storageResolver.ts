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
        if (this.characterAdapter) return this.characterAdapter;

        const mod = import.meta.env.VITEST
            ? await import("./character/LocalStorageCharacterAdapter")
            : await import("./character/IDBCharacterAdapter");
        this.characterAdapter = new mod.default();
        return this.characterAdapter;
    }

    /**
     * Get the chat storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getChatAdapter(): Promise<IChatStorageAdapter> {
        if (this.chatAdapter) return this.chatAdapter;

        const mod = import.meta.env.VITEST
            ? await import("./chat/LocalStorageChatAdapter")
            : await import("./chat/IDBChatAdapter");
        this.chatAdapter = new mod.default();
        return this.chatAdapter;
    }

    /**
     * Get the persona storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getPersonaAdapter(): Promise<IPersonaStorageAdapter> {
        if (this.personaAdapter) return this.personaAdapter;

        const mod = import.meta.env.VITEST
            ? await import("./persona/LocalStoragePersonaAdapter")
            : await import("./persona/IDBPersonaAdapter");
        this.personaAdapter = new mod.default();
        return this.personaAdapter;
    }

    /**
     * Get the settings storage adapter (singleton).
     * Uses dynamic import for code splitting.
     */
    static async getSettingsAdapter(): Promise<ISettingsStorageAdapter> {
        if (this.settingsAdapter) return this.settingsAdapter;

        const mod = import.meta.env.VITEST
            ? await import("./settings/LocalStorageSettingsAdapter")
            : await import("./settings/IDBSettingsAdapter");
        this.settingsAdapter = new mod.default();
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
