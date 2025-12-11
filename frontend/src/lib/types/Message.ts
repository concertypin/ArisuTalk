import { z } from "zod";

/**
 * Represents the role of the message sender.
 */
export const RoleSchema = z.union([z.literal("user"), z.literal("assistant"), z.literal("system")]);

/**
 * @see {@link Message}
 */
export const MessageSchema = z.object({
    /** Unique identifier for the message. */
    id: z.string(),
    /** The role of the message sender. */
    role: RoleSchema,
    /** The content of the message. */
    content: z.string(),
    /** The timestamp when the message was created. */
    timestamp: z.number().optional(),
});

/**
 * Represents a single message in a chat history.
 */
export type Message = z.infer<typeof MessageSchema>;
