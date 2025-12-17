import { getArisuDB } from "../IndexedDBHelper";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import type { Persona } from "@/features/persona/schema";
import { SettingsSchema } from "@/lib/types/IDataModel";

export class IDBPersonaAdapter implements IPersonaStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        await this.db.open();
    }

    async getAllPersonas(): Promise<Persona[]> {
        return this.db.personas.toArray();
    }

    async savePersona(persona: Persona): Promise<void> {
        await this.db.personas.put(persona);
    }

    async updatePersona(id: string, persona: Persona): Promise<void> {
        await this.db.personas.put({ ...persona, id });
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
            const defaults = SettingsSchema.parse({
                activePersonaId: id,
            });
            await this.db.settings.put({
                ...defaults,
                id: "singleton",
            });
        }
    }
}
