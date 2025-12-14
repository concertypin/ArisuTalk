import { Settings } from "@/lib/types/IDataModel";

/**
 * Interface for settings storage adapters.
 */
export interface ISettingsStorageAdapter {
    init(): Promise<void>;
    saveSettings(settings: Settings): Promise<void>;
    getSettings(): Promise<Settings>;
}
