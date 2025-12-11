import { z } from "zod";
import { MessageSchema } from "@/lib/types/Message";

/**
 * @see {@link Chat}
 */
export const ChatSchema = z.object({
    /**
     * Unique identifier for the chat session.
     */
    id: z.string(),
    /**
     * The ID of the character associated with this chat.
     */
    characterId: z.string(),
    /**
     * The list of messages in this chat.
     */
    messages: z.array(MessageSchema),
    /**
     * Optional title for the chat.
     */
    title: z.string().optional(),
    /**
     * creation timestamp(unix epoch)
     */
    createdAt: z.number().default(Date.now),
    /**
     * Last updated timestamp(unix epoch)
     */
    updatedAt: z.number().default(Date.now),
});

/**
 * Represents a chat session with a character.
 */
export type Chat = z.infer<typeof ChatSchema>;
