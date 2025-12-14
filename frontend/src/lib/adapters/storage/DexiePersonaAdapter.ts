import { getArisuDB } from "./DexieDB";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import type { Persona } from "@/features/persona/schema";

export class DexiePersonaAdapter implements IPersonaStorageAdapter {
    private db = getArisuDB();

    async init(): Promise<void> {
        return Promise.resolve();
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
        const rec = (await this.db.settings.get("active_persona")) as
            | { id: string; value?: string }
            | undefined;
        return rec?.value ?? null;
    }

    async setActivePersonaId(id: string | null): Promise<void> {
        if (id === null) await this.db.settings.delete("active_persona");
        else await this.db.settings.put({ id: "active_persona", value: id });
    }
}
