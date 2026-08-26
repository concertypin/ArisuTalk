/**
 * @fileoverview Prompt template types for saving and reusing prompt configurations.
 */

/**
 * A saved prompt template containing the system/generation prompts for characters or global settings.
 */
export interface PromptTemplate {
    /** Unique identifier for the template. */
    id: string;
    /** Human-readable name for the template. */
    name: string;
    /** Optional description of what this template is for. */
    description: string;
    /** The prompt contents stored in the template. */
    prompts: {
        /** Character description / system prompt (maps to character.prompt.description). */
        system: string;
        /** Generation / assistant instruction prompt (maps to settings generationPrompt). */
        generation: string;
        /** Optional lorebook entries or author's note content. */
        lore?: string;
    };
    /** ISO-8601 timestamp when the template was created. */
    createdAt: string;
    /** ISO-8601 timestamp when the template was last updated. */
    updatedAt: string;
}
