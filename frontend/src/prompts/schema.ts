import z from "zod";

export const messageSchema = z.object({
    delay: z.int().positive(),
    content: z.string(), // Made content required
    sticker: z.string().optional(),
});
export const characterStateSchema = z.object({
    affection: z.number(),
    intimacy: z.number(),
    trust: z.number(),
    romantic_interest: z.number(),
    reason: z.string(),
});
export const autoPostSchema = z.object({
    type: z.string(),
    content: z.string(),
    access_level: z.string(),
    importance: z.number(),
    tags: z.array(z.string()),
    emotion: z.string(),
});
export const naiStickerSchema = z.object({
    emotion: z.string(),
    situationPrompt: z.string(),
});

export const autoGenerateStickerSchema = z.object({
    emotion: z.string(),
});

export const generateContentSchema = z.object({
    reactionDelay: z.number().int(),
    messages: z.array(messageSchema),
    characterState: characterStateSchema.optional(),
    autoPost: autoPostSchema.optional(),
    naiSticker: naiStickerSchema.optional(),
    autoGenerateSticker: autoGenerateStickerSchema.optional(),
});

export const profileGenerationSchema = z.object({
    name: z.string(),
    prompt: z.string(),
});