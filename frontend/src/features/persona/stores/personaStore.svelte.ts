import { type Persona, PersonaSchema } from "@/features/persona/schema";
import type { IPersonaStorageAdapter } from "@/lib/interfaces";
import { StorageResolver } from "@/lib/adapters/storage/storageResolver";
import { Logger } from "@common/logger/Logger";

export class PersonaStore {
    personas = $state<Persona[]>([]);
    activePersonaId = $state<string | null>(null);
    private adapter!: IPersonaStorageAdapter;
    public readonly initPromise: Promise<void>;

    constructor(adapter?: IPersonaStorageAdapter) {
        // Synchronously populate from localStorage for backward compatibility (tests and sync callers).
        this.syncLoadFromLocalStorage();
        // Continue async initialization with adapter in background.
        this.initPromise = this.initialize(adapter);
    }

    private async initialize(adapter?: IPersonaStorageAdapter) {
        this.adapter = adapter || (await StorageResolver.getPersonaAdapter());
        await this.load();
    }

    private async load() {
        try {
            await this.adapter.init();
            const loaded = await this.adapter.getAllPersonas();
            // Apply saved order if present
            const order = this.getOrder();
            if (order && order.length) {
                const map: Record<string, Persona> = {};
                for (const p of loaded) map[p.id] = p;
                const ordered: Persona[] = [];
                for (const id of order) {
                    const p = map[id];
                    if (p) {
                        ordered.push(p);
                        delete map[id];
                    }
                }
                // append any personas not present in the stored order
                for (const p of loaded) {
                    if (map[p.id]) ordered.push(p);
                }
                this.personas = ordered;
            } else {
                this.personas = loaded;
            }
            this.activePersonaId = await this.adapter.getActivePersonaId();
        } catch (e) {
            Logger.error("Failed to load personas", e);
        }
    }

    private syncLoadFromLocalStorage() {
        try {
            const stored = localStorage.getItem("arisutalk_personas");
            if (stored) {
                const parsed: unknown = JSON.parse(stored);
                const result = PersonaSchema.array().safeParse(parsed);
                if (result.success) {
                    this.personas = result.data;
                }
            }
            const active = localStorage.getItem("arisutalk_active_persona");
            this.activePersonaId = active;
        } catch (e) {
            Logger.error("Failed to synchronously load personas", e);
        }
    }

    add(persona: Persona) {
        // Validate?
        const result = PersonaSchema.safeParse(persona);
        if (!result.success) {
            throw new Error(result.error.message);
        }

        // Update in-memory state immediately for sync callers/tests.
        this.personas.push(persona);
        // Persist order immediately so new persona is reflected on reload.
        this.saveOrder();
        // Persist in background.
        void this.adapter
            .savePersona(persona)
            .catch((e) => Logger.error("Failed to save persona", e));
    }

    update(id: string, updated: Persona) {
        const index = this.personas.findIndex((p) => p.id === id);
        if (index !== -1) {
            this.personas[index] = updated;
            void this.adapter
                .updatePersona(id, updated)
                .catch((e) => Logger.error("Failed to update persona", e));
        }
    }

    remove(id: string) {
        void this.adapter
            .deletePersona(id)
            .catch((e) => Logger.error("Failed to delete persona", e));
        this.personas = this.personas.filter((p) => p.id !== id);
        if (this.activePersonaId === id) {
            this.activePersonaId = null;
        }
        // Persist order immediately so removal is reflected on reload.
        this.saveOrder();
    }

    select(id: string | null) {
        void this.adapter
            .setActivePersonaId(id)
            .catch((e) => Logger.error("Failed to set active persona", e));
        this.activePersonaId = id;
    }

    get activePersona(): Persona | null {
        return this.personas.find((p) => p.id === this.activePersonaId) || null;
    }

    // --- Reorder Support ---
    private readonly ORDER_KEY = "arisutalk_persona_order";

    private getOrder(): string[] {
        try {
            const stored = localStorage.getItem(this.ORDER_KEY);
            if (!stored) return [];
            const parsed: unknown = JSON.parse(stored);
            return Array.isArray(parsed) && parsed.every((value) => typeof value === "string")
                ? parsed
                : [];
        } catch {
            return [];
        }
    }

    private saveOrder() {
        const ids = this.personas.map((p) => p.id);
        localStorage.setItem(this.ORDER_KEY, JSON.stringify(ids));
    }

    reorder(fromIndex: number, toIndex: number) {
        if (
            fromIndex < 0 ||
            fromIndex >= this.personas.length ||
            toIndex < 0 ||
            toIndex >= this.personas.length
        ) {
            return;
        }

        const item = this.personas.splice(fromIndex, 1)[0];
        this.personas.splice(toIndex, 0, item);
        this.saveOrder();
    }
}

export const personaStore = new PersonaStore();
