import * as z from "zod";

/**
 * @see {@link LorebookEntry}
 */
export const LorebookEntrySchema = z.object({
    /**
     * Internally generated ID.
     */
    id: z.string().default(crypto.randomUUID),
    /**
     * Human readable name for the lorebook.
     */
    name: z.string(),
    /**
     * The condition for the lorebook to be activated.
     * If empty, it will not be activated.
     * Duplicated condition is no effect.
     * Use 'always' to activate without any condition. {@link LorebookConditionTypeMap#always}
     */
    condition: z.array(z.custom<LorebookCondition>()).default([]),
    /**
     * The strategy for resolving multiple conditions.
     * "all" means all conditions must be met.
     * "any" means at least one condition must be met.
     */
    multipleConditionResolveStrategy: z.enum(["all", "any"]).default("all"),
    /**
     * The lorebook content to be added on AI prompt.
     * Not for human reading, and it's scriptable.
     */
    content: z.string(),
    /**
     * The priority of the lorebook.
     * Higher priority means it will be activated first, remains when token limit is exceeded.
     * May be negative. Base is 0. Allows demical.
     */
    priority: z.number().default(0),
    /**
     * Whether the lorebook is enabled.
     */
    enabled: z.boolean().default(true),
});
/**
 * A lorebook is a collection of lorebooks.
 * Lorebook is a small part of prompts which is activated by session's text matching.
 */
export type LorebookEntry = z.infer<typeof LorebookEntrySchema>;

/**
 * @see {@link LorebookConditionSchema}
 */
export const LorebookConditionDetailSchema = {
    regex: z.object({
        /**
         * The type of the condition.
         * This condition matches the regex pattern.
         */
        type: z.literal("regex_match"),
        /**
         * The regex pattern to match.
         * Note that this is scriptable.
         */
        regexPattern: z.string(),
        /**
         * The regex flags to use.
         * Note that this is not scriptable.
         */
        regexFlags: z.string().optional(),
    }),
    plainText: z.object({
        /**
         * The type of the condition.
         * This condition simply matches the text.
         */
        type: z.literal("plain_text_match"),
        /**
         * The text to match.
         * Note that this is scriptable.
         * No case sensitive.
         */
        text: z.string(),
    }),
    always: z.object({
        /**
         * The type of the condition.
         * This condition is always true.
         */
        type: z.literal("always"),
    }),
} as const;

/**
 * The condition for the lorebook to be activated.
 */
export const LorebookConditionSchema = z.discriminatedUnion("type", [
    LorebookConditionDetailSchema.regex,
    LorebookConditionDetailSchema.plainText,
    LorebookConditionDetailSchema.always,
]);

/**
 * The condition for the lorebook to be activated.
 * @see {@link LorebookConditionSchema}
 */
export type LorebookCondition = z.infer<typeof LorebookConditionSchema>;

/**
 * @see {@link LorebookData}
 */
export const LorebookDataSchema = z.object({
    /**
     * The configuration for the lorebook.
     * It is not scriptable.
     */
    config: z.object({
        /**
         * The token limit for the lorebook.
         * When the token limit is exceeded, some low-priority lorebooks will be deactivated to keep the token usage within the limit.
         * Positive integer.
         */
        tokenLimit: z.int().positive(),
    }),
    /**
     * Contains the actual lorebooks.
     * Duplicated id is not allowed.
     */
    data: z
        .array(LorebookEntrySchema)
        .refine(
            (data) => data.map((i) => i.id).length === new Set(data.map((i) => i.id)).size,
            "Duplicated id is not allowed."
        )
        .default([]),
});
/**
 * Object containing all data for the lorebook.
 * It's meant to be stored in the database and many other places.
 */
export type LorebookData = z.infer<typeof LorebookDataSchema>;
