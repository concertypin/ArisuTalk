import type { IPersonaStorageAdapter } from "@/lib/interfaces/IPersonaStorageAdapter";
import type { Persona } from "@/features/persona/schema";

const BASE_URL = "http://localhost:3000";

export class ServerPersonaAdapter implements IPersonaStorageAdapter {
    async init(): Promise<void> {
        // No-op
    }

    async getAllPersonas(): Promise<Persona[]> {
        const res = await fetch(`${BASE_URL}/personas`);
        if (!res.ok) throw new Error(`Failed to get all personas: ${res.statusText}`);
        const data = (await res.json()) as Persona[];
        return data;
    }

    async savePersona(persona: Persona): Promise<void> {
        const res = await fetch(`${BASE_URL}/personas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(persona),
        });
        if (!res.ok) throw new Error(`Failed to save persona: ${res.statusText}`);
    }

    async updatePersona(id: string, persona: Persona): Promise<void> {
        const res = await fetch(`${BASE_URL}/personas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(persona),
        });
        if (!res.ok) throw new Error(`Failed to update persona: ${res.statusText}`);
    }

    async deletePersona(id: string): Promise<void> {
        const res = await fetch(`${BASE_URL}/personas/${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(`Failed to delete persona: ${res.statusText}`);
    }

    async getActivePersonaId(): Promise<string | null> {
        const res = await fetch(`${BASE_URL}/personas/active`);
        if (!res.ok) throw new Error(`Failed to get active persona ID: ${res.statusText}`);
        const data = (await res.json()) as { id: string | null };
        return data.id;
    }

    async setActivePersonaId(id: string | null): Promise<void> {
        const res = await fetch(`${BASE_URL}/personas/active`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        if (!res.ok) throw new Error(`Failed to set active persona ID: ${res.statusText}`);
    }
}
export default ServerPersonaAdapter;
