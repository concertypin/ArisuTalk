import { getArisuDB } from "@/lib/adapters/storage/IndexedDBHelper";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import type { Persona } from "@/features/persona/schema";
import { SettingsSchema } from "@/lib/types/IDataModel";
import { apply } from "@arisutalk/character-spec/utils";
import { cloneDeep } from "lodash-es";

export class IDBPersonaAdapter implements IPersonaStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async getAllPersonas(): Promise<Persona[]> {
        return this.db.personas.toArray();
    }

    async savePersona(persona: Persona): Promise<void> {
        // Remove Svelte proxy wrapper by serializing/deserializing
        const plainPersona = cloneDeep(persona);
        await this.db.personas.put(plainPersona);
    }

    async updatePersona(id: string, persona: Persona): Promise<void> {
        // Remove Svelte proxy wrapper by serializing/deserializing
        const plainPersona = cloneDeep({ ...persona, id });
        await this.db.personas.put(plainPersona);
    }

    async deletePersona(id: string): Promise<void> {
        await this.db.personas.delete(id);
    }

    async getActivePersonaId(): Promise<string | null> {
        const rec = await this.db.settings.get("singleton");
        return rec?.activePersonaId ?? null;
    }

    async setActivePersonaId(id: string | null): Promise<void> {
        const updatedCount = await this.db.settings.update("singleton", {
            activePersonaId: id,
        });
        if (updatedCount === 0) {
            // If no settings record existed, create one with defaults
            const defaults = apply(SettingsSchema, {
                activePersonaId: id,
            });
            // Remove Svelte proxy wrapper by serializing/deserializing
            const plainDefaults = cloneDeep({
                ...defaults,
                id: "singleton",
            });
            await this.db.settings.put(plainDefaults);
        }
    }
}

export default IDBPersonaAdapter;
