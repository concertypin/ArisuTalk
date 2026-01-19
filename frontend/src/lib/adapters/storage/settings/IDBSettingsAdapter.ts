import { getArisuDB } from "../IndexedDBHelper";
import type { ISettingsStorageAdapter } from "@/lib/interfaces";
import { type Settings, SettingsSchema } from "@/lib/types/IDataModel";
import { apply } from "@arisutalk/character-spec/utils";
import { cloneDeep } from "lodash-es";

export class IDBSettingsAdapter implements ISettingsStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async saveSettings(settings: Settings): Promise<void> {
        // Remove Svelte proxy wrapper by serializing/deserializing
        const plainSettings = cloneDeep({ ...settings, id: "singleton" });
        await this.db.settings.put(plainSettings);
    }

    async getSettings(): Promise<Settings> {
        const stored = await this.db.settings.get("singleton");
        const inst = apply(SettingsSchema, {});
        if (!stored) return inst;
        Object.assign(inst, stored);
        return inst;
    }
}
export default IDBSettingsAdapter;
