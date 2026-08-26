import type { PromptTemplate } from "@/lib/types/promptTemplate";

/**
 * Interface for prompt template storage adapters.
 * Handles persistence of saved prompt templates.
 */
export interface IPromptTemplateStorageAdapter {
    /**
     * Initializes the storage adapter.
     */
    init(): Promise<void>;

    /**
     * Retrieves all saved prompt templates.
     * @returns Promise resolving to an array of all templates.
     */
    getAll(): Promise<PromptTemplate[]>;

    /**
     * Retrieves a single template by ID.
     * @param id - The ID of the template to retrieve.
     * @returns Promise resolving to the template, or `undefined` if not found.
     */
    get(id: string): Promise<PromptTemplate | undefined>;

    /**
     * Saves (creates or overwrites) a prompt template.
     * @param template - The template to save.
     */
    save(template: PromptTemplate): Promise<void>;

    /**
     * Deletes a prompt template by ID.
     * @param id - The ID of the template to delete.
     */
    delete(id: string): Promise<void>;
}
