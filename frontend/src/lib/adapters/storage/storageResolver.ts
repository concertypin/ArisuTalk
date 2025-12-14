import type {
    ICharacterStorageAdapter,
    IChatStorageAdapter,
    IPersonaStorageAdapter,
    ISettingsStorageAdapter,
} from "@/lib/interfaces";
import { DexieCharacterAdapter } from "./character/IDBCharacterAdapter";
import { DexieChatAdapter } from "./chat/IDBChatAdapter";
import { DexiePersonaAdapter } from "./persona/IDBPersonaAdapter";
import { DexieSettingsAdapter } from "./settings/IDBSettingsAdapter";

/**
 * Storage resolver that provides the appropriate storage adapters.
 * Defaults to IndexedDB (Dexie) for production use.
 */
export class StorageResolver {
    private static characterAdapter: ICharacterStorageAdapter | null = null;
    private static chatAdapter: IChatStorageAdapter | null = null;
    private static personaAdapter: IPersonaStorageAdapter | null = null;
    private static settingsAdapter: ISettingsStorageAdapter | null = null;

    /**
     * Get the character storage adapter (singleton).
     */
    static getCharacterAdapter(): ICharacterStorageAdapter {
        if (!this.characterAdapter) {
            this.characterAdapter = new DexieCharacterAdapter();
        }
        return this.characterAdapter;
    }

    /**
     * Get the chat storage adapter (singleton).
     */
    static getChatAdapter(): IChatStorageAdapter {
        if (!this.chatAdapter) {
            this.chatAdapter = new DexieChatAdapter();
        }
        return this.chatAdapter;
    }

    /**
     * Get the persona storage adapter (singleton).
     */
    static getPersonaAdapter(): IPersonaStorageAdapter {
        if (!this.personaAdapter) {
            this.personaAdapter = new DexiePersonaAdapter();
        }
        return this.personaAdapter;
    }

    /**
     * Get the settings storage adapter (singleton).
     */
    static getSettingsAdapter(): ISettingsStorageAdapter {
        if (!this.settingsAdapter) {
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
