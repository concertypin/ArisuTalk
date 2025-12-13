import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import type { Persona } from "@/features/persona/schema";

export class LocalStoragePersonaAdapter implements IPersonaStorageAdapter {
    private readonly PERSONAS_KEY = "arisutalk_personas";
    private readonly ACTIVE_KEY = "arisutalk_active_persona";

    async init(): Promise<void> {
        // LocalStorage is synchronous and always ready in browser environment
        return Promise.resolve();
    }

    private getStoredPersonas(): Persona[] {
        try {
            const stored = localStorage.getItem(this.PERSONAS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load personas", e);
            return [];
        }
    }

    private saveStoredPersonas(personas: Persona[]): void {
        try {
            localStorage.setItem(this.PERSONAS_KEY, JSON.stringify(personas));
        } catch (e) {
            console.error("Failed to save personas", e);
        }
    }

    async getAllPersonas(): Promise<Persona[]> {
        return this.getStoredPersonas();
    }

    async savePersona(persona: Persona): Promise<void> {
        const personas = this.getStoredPersonas();
        const existingIndex = personas.findIndex((p) => p.id === persona.id);

        if (existingIndex !== -1) {
            personas[existingIndex] = persona;
        } else {
            personas.push(persona);
        }

        this.saveStoredPersonas(personas);
    }

    async updatePersona(id: string, persona: Persona): Promise<void> {
        const personas = this.getStoredPersonas();
        const index = personas.findIndex((p) => p.id === id);

        if (index !== -1) {
            personas[index] = persona;
            this.saveStoredPersonas(personas);
        }
    }

    async deletePersona(id: string): Promise<void> {
        const personas = this.getStoredPersonas();
        const filtered = personas.filter((p) => p.id !== id);
        this.saveStoredPersonas(filtered);

        // If the deleted persona was active, clear the active persona
        const activeId = await this.getActivePersonaId();
        if (activeId === id) {
            await this.setActivePersonaId(null);
        }
    }

    async getActivePersonaId(): Promise<string | null> {
        try {
            return localStorage.getItem(this.ACTIVE_KEY);
        } catch (e) {
            console.error("Failed to get active persona", e);
            return null;
        }
    }

    async setActivePersonaId(id: string | null): Promise<void> {
        try {
            if (id) {
                localStorage.setItem(this.ACTIVE_KEY, id);
            } else {
                localStorage.removeItem(this.ACTIVE_KEY);
            }
        } catch (e) {
            console.error("Failed to set active persona", e);
        }
    }
}
