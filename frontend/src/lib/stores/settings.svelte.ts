/**
 * @fileoverview Global Settings state using Svelte 5 Runes.
 */
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { SettingsSchema, type Settings } from "@/lib/types/IDataModel";

class SettingsStore {
    value = $state<Settings>(SettingsSchema.parse({}));
    isLoaded = $state(false);

    async init() {
        try {
            const adapter = await StorageResolver.getSettingsAdapter();
            await adapter.init();
            const stored = await adapter.getSettings();
            this.value = stored;
        } catch (e) {
            console.error("Failed to load settings", e);
        } finally {
            this.isLoaded = true;
        }
    }

    async save() {
        try {
            const adapter = await StorageResolver.getSettingsAdapter();
            // Create a snapshot to ensure we pass a plain object to storage
            // This avoids issues with proxies in some storage adapters
            const plainSettings = $state.snapshot(this.value);
            await adapter.saveSettings(plainSettings);
        } catch (e) {
            console.error("Failed to save settings", e);
        }
    }
}

export const settings = new SettingsStore();
