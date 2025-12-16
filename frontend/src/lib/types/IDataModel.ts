import * as z from "zod";
/**
 * Represents application settings.
 */
export type Settings = z.infer<typeof SettingsSchema>;

export const SettingsSchema = z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    userId: z.string().default(() => crypto.randomUUID()),
    activePersonaId: z.string().nullable().default(null),
});
