import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import { PersonaSchema, type Persona } from "@/features/persona/schema";

/**
 * LocalStorage-based persona storage adapter.
 * For development/testing purposes only.
 */
export class LocalStoragePersonaAdapter implements IPersonaStorageAdapter {
    private readonly PERSONAS_KEY = "arisutalk_personas";
    private readonly ACTIVE_KEY = "arisutalk_active_persona";

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === "object" && value !== null;
    }

    async init(): Promise<void> {
        if (!import.meta.env.DEV) {
            console.warn("LocalStoragePersonaAdapter is for development/testing only.");
        }
        return Promise.resolve();
    }

    private getStored(): Persona[] {
        const item = localStorage.getItem(this.PERSONAS_KEY);
        if (!item) return [];
        try {
            const parsed = JSON.parse(item) as unknown;
            const result = PersonaSchema.array().safeParse(parsed);
            return result.success ? result.data : [];
        } catch {
            return [];
        }
    }

    private setStored(data: Persona[]): void {
        localStorage.setItem(this.PERSONAS_KEY, JSON.stringify(data));
    }

    async getAllPersonas(): Promise<Persona[]> {
        return this.getStored();
    }

    async savePersona(persona: Persona): Promise<void> {
        const personas = this.getStored();
        const index = personas.findIndex((p) => p.id === persona.id);

        if (index >= 0) {
            personas[index] = persona;
        } else {
            personas.push(persona);
        }
        this.setStored(personas);
    }

    async updatePersona(id: string, persona: Persona): Promise<void> {
        await this.savePersona({ ...persona, id });
    }

    async deletePersona(id: string): Promise<void> {
        const personas = this.getStored();
        const filtered = personas.filter((p) => p.id !== id);
        this.setStored(filtered);
    }

    async getActivePersonaId(): Promise<string | null> {
        const active = localStorage.getItem(this.ACTIVE_KEY);
        return typeof active === "string" ? active : null;
    }

    async setActivePersonaId(id: string | null): Promise<void> {
        if (id === null) {
            localStorage.removeItem(this.ACTIVE_KEY);
        } else {
            localStorage.setItem(this.ACTIVE_KEY, id);
        }
    }
}
