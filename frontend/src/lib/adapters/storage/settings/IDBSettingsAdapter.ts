import { getArisuDB } from "../IndexedDBHelper";
import type { ISettingsStorageAdapter } from "@/lib/interfaces";
import { Settings, SettingsSchema } from "@/lib/types/IDataModel";

export class IDBSettingsAdapter implements ISettingsStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async saveSettings(settings: Settings): Promise<void> {
        await this.db.settings.put({ ...settings, id: "singleton" });
    }

    async getSettings(): Promise<Settings> {
        const stored = await this.db.settings.get("singleton");
        const inst = SettingsSchema.parse({});
        if (!stored) return inst;
        Object.assign(inst, stored);
        return inst;
    }
}
export default IDBSettingsAdapter;
