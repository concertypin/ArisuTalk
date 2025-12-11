import { LorebookDataSchema } from "@/lib/types/Lorebook";
import * as z from "zod";

/**
 * The prompt data for a character.
 * It is used to generate the character's persona.
 * All of parameters are for AI prompt, and scriptable.
 */
export type CharacterPromptData = z.infer<typeof CharacterPromptDataSchema>;
/**
 * @see {@link CharacterPromptData}
 */
export const CharacterPromptDataSchema = z.object({
    /**
     * The character description.
     */
    description: z.string(),
    /**
     * The authors note. It's usually used to mock the user's message(differ by prompt).
     */
    authorsNote: z.string(),
    /**
     * Lorebook data. @see {@link LorebookDataSchema}
     */
    lorebook: LorebookDataSchema,
});

/**
 * @see {@link Character}
 */
export const CharacterSchema = z.object({
    /**
     * Unique identifier for the character.
     */
    id: z.string(),
    /**
     * The display name of the character.
     * Human readable, not scriptable.
     */
    name: z.string(),
    /**
     * A short description of the character.
     * Human readable, not scriptable.
     */
    description: z.string(),
    /**
     * Optional URL for the character's avatar image.
     */
    avatarUrl: z.url().optional(),
    prompt: CharacterPromptDataSchema,
});

/**
 * Represents a specific AI character personality.
 */
export type Character = z.infer<typeof CharacterSchema>;
