import type { ISettingsStorageAdapter } from "@/lib/interfaces";
import { type Settings, SettingsSchema } from "@/lib/types/IDataModel";
import { apply } from "@arisutalk/character-spec/utils";
import { Logger } from "@common/logger/Logger";

/**
 * LocalStorage-based settings storage adapter.
 * For development/testing purposes only.
 */
export class LocalStorageSettingsAdapter implements ISettingsStorageAdapter {
    private readonly KEY = "arisutalk_settings";

    async init(): Promise<void> {
        if (!import.meta.env.DEV) {
            Logger.warn("LocalStorageSettingsAdapter is for development/testing only.");
        }
        return Promise.resolve();
    }

    async saveSettings(settings: Settings): Promise<void> {
        localStorage.setItem(this.KEY, JSON.stringify(settings));
    }

    async getSettings(): Promise<Settings> {
        const item = localStorage.getItem(this.KEY);
        if (!item) {
            return apply(SettingsSchema, {});
        }
        // Keep parse() here - validates external JSON data
        return SettingsSchema.parse(JSON.parse(item));
    }
}

export default LocalStorageSettingsAdapter;
