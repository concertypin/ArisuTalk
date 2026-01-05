import type { ISettingsStorageAdapter } from "@/lib/interfaces/ISettingsStorageAdapter";
import type { Settings } from "@/lib/types/IDataModel";
import { SettingsSchema } from "@/lib/types/IDataModel";

const BASE_URL = "http://localhost:3000";

export class ServerSettingsAdapter implements ISettingsStorageAdapter {
    async init(): Promise<void> {
        // No-op
    }

    async saveSettings(settings: Settings): Promise<void> {
        const res = await fetch(`${BASE_URL}/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });
        if (!res.ok) throw new Error(`Failed to save settings: ${res.statusText}`);
    }

    async getSettings(): Promise<Settings> {
        const res = await fetch(`${BASE_URL}/settings`);
        if (res.status === 404) {
            // Return default settings if not found
            return SettingsSchema.parse({});
        }
        if (!res.ok) throw new Error(`Failed to get settings: ${res.statusText}`);
        const data = (await res.json()) as Settings;
        return data;
    }
}
export default ServerSettingsAdapter;
