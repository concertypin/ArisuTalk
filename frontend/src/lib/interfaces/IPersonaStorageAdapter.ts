import type { Persona } from "@/features/persona/schema";

/**
 * Interface for persona storage adapters.
 * Handles persistence of user personas.
 */
export interface IPersonaStorageAdapter {
    /**
     * Initializes the storage adapter.
     */
    init(): Promise<void>;

    /**
     * Retrieves all personas.
     * @returns Promise resolving to an array of personas.
     */
    getAllPersonas(): Promise<Persona[]>;

    /**
     * Saves a persona.
     * @param persona - The persona to save.
     */
    savePersona(persona: Persona): Promise<void>;

    /**
     * Updates an existing persona.
     * @param id - The ID of the persona to update.
     * @param persona - The updated persona data.
     */
    updatePersona(id: string, persona: Persona): Promise<void>;

    /**
     * Deletes a persona by ID.
     * @param id - The ID of the persona to delete.
     */
    deletePersona(id: string): Promise<void>;

    /**
     * Gets the active persona ID.
     * @returns Promise resolving to the active persona ID or null if none is active.
     */
    getActivePersonaId(): Promise<string | null>;

    /**
     * Sets the active persona ID.
     * @param id - The ID of the persona to set as active, or null to clear.
     */
    setActivePersonaId(id: string | null): Promise<void>;
}
