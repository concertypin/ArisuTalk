import { z } from "zod";
import { AssetsSettingSchema } from "@arisutalk/character-spec/v0/Character/Assets";

/**
 * Persona schema for user identity in chat.
 * This is a frontend-specific concept and not part of the official ArisuTalk character spec yet.
 */
export const PersonaSchema = z.object({
    /** internal id */
    id: z.string(),
    /** Human readable name */
    name: z.string().min(1, "Name is required"),
    /** Scriptable description, used for AI prompting */
    description: z.string(),
    /** Human readable note, not used for AI */
    note: z.string().optional(),
    /** Public/Private assets, similar to Character */
    assets: AssetsSettingSchema.optional(),
    /** ID or Name of the asset to use as the profile picture */
    profileAsset: z.string().optional(),
});

export type Persona = z.infer<typeof PersonaSchema>;
