import type { ISettingsStorageAdapter } from "@/lib/interfaces";
import { Settings, SettingsSchema } from "@/lib/types/IDataModel";

/**
 * LocalStorage-based settings storage adapter.
 * For development/testing purposes only.
 */
export class LocalStorageSettingsAdapter implements ISettingsStorageAdapter {
    private readonly KEY = "arisutalk_settings";

    async init(): Promise<void> {
        if (!import.meta.env.DEV) {
            console.warn("LocalStorageSettingsAdapter is for development/testing only.");
        }
        return Promise.resolve();
    }

    async saveSettings(settings: Settings): Promise<void> {
        localStorage.setItem(this.KEY, JSON.stringify(settings));
    }

    async getSettings(): Promise<Settings> {
        const item = localStorage.getItem(this.KEY);
        if (!item) {
            return SettingsSchema.parse({});
        }
        return SettingsSchema.parse(JSON.parse(item));
    }
}
