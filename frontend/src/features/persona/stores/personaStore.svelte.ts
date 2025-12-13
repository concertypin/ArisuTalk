import { type Persona, PersonaSchema } from "../schema";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import { LocalStoragePersonaAdapter } from "@/features/persona/adapters/storage/LocalStoragePersonaAdapter";

export class PersonaStore {
    personas = $state<Persona[]>([]);
    activePersonaId = $state<string | null>(null);
    private adapter: IPersonaStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IPersonaStorageAdapter) {
        this.adapter = adapter || new LocalStoragePersonaAdapter();
        this.initPromise = this.load();
    }

    private async load() {
        try {
            await this.adapter.init();
            this.personas = await this.adapter.getAllPersonas();
            this.activePersonaId = await this.adapter.getActivePersonaId();
        } catch (e) {
            console.error("Failed to load personas", e);
        }
    }

    async add(persona: Persona) {
        // Validate?
        const result = PersonaSchema.safeParse(persona);
        if (!result.success) {
            throw new Error(result.error.message);
        }

        await this.adapter.savePersona(persona);
        this.personas.push(persona);
    }

    async update(id: string, updated: Persona) {
        const index = this.personas.findIndex((p) => p.id === id);
        if (index !== -1) {
            await this.adapter.updatePersona(id, updated);
            this.personas[index] = updated;
        }
    }

    async remove(id: string) {
        await this.adapter.deletePersona(id);
        this.personas = this.personas.filter((p) => p.id !== id);
        if (this.activePersonaId === id) {
            this.activePersonaId = null;
        }
    }

    async select(id: string | null) {
        await this.adapter.setActivePersonaId(id);
        this.activePersonaId = id;
    }

    get activePersona() {
        return this.personas.find((p) => p.id === this.activePersonaId);
    }
}

export const personaStore = new PersonaStore();
