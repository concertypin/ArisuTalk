import { type Persona, PersonaSchema } from "../schema";

export class PersonaStore {
    personas = $state<Persona[]>([]);
    activePersonaId = $state<string | null>(null);

    private readonly STORAGE_KEY = "arisutalk_personas";
    private readonly ACTIVE_KEY = "arisutalk_active_persona";

    constructor() {
        this.load();
    }

    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.personas = JSON.parse(stored);
            }
            this.activePersonaId = localStorage.getItem(this.ACTIVE_KEY);
        } catch (e) {
            console.error("Failed to load personas", e);
        }
    }

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.personas));
        if (this.activePersonaId) {
            localStorage.setItem(this.ACTIVE_KEY, this.activePersonaId);
        } else {
            localStorage.removeItem(this.ACTIVE_KEY);
        }
    }

    add(persona: Persona) {
        // Validate?
        const result = PersonaSchema.safeParse(persona);
        if (!result.success) {
            throw new Error(result.error.message);
        }
        this.personas.push(persona);
        this.save();
    }

    update(id: string, updated: Persona) {
        const index = this.personas.findIndex((p) => p.id === id);
        if (index !== -1) {
            this.personas[index] = updated;
            this.save();
        }
    }

    remove(id: string) {
        this.personas = this.personas.filter((p) => p.id !== id);
        if (this.activePersonaId === id) {
            this.activePersonaId = null;
        }
        this.save();
    }

    select(id: string | null) {
        this.activePersonaId = id;
        this.save();
    }

    get activePersona() {
        return this.personas.find((p) => p.id === this.activePersonaId);
    }
}

export const personaStore = new PersonaStore();
