import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import type { Chat } from "@arisutalk/character-spec/v0/Character";

/** Type of chat session. */
export type ChatType = "direct" | "group" | "open";

/**
 * Branching information for a message.
 * Tracks the parent message this branch originates from and the root of the branching tree.
 */
export type BranchingInfo = {
    /** The ID of the parent message this branch originates from. */
    branchFromId?: string;
    /** The ID of the root message of the branching tree. */
    branchRootId?: string;
};

/** A message with branching support. */
export type ChatMessage = Message & BranchingInfo;

/**
 * Represents the affection state for a character within a chat.
 */
export type AffectionState = {
    /** The ID of the character this affection pertains to. */
    characterId: string;
    /** The affection value (e.g., 0-100 or -100-100). */
    value: number;
    /** Timestamp (unix epoch) of the last update. */
    lastUpdated: number;
    /** Optional notes about this affection state. */
    notes?: string;
};

export type LocalChat = Chat & {
    name: string;
    lastMessage: number;
    characterId: string;
    /** The type of chat session. */
    chatType?: ChatType;
    /** IDs of participants in group chats. */
    participantIds?: string[];
    /** The ID of the user who created this chat. */
    creatorId?: string;
    /** The ID of the chat this was branched from (if branched). */
    parentChatId?: string;
    /** The root message ID for the branching tree. */
    branchRootId?: string;
    /** Affection states for characters in this chat. */
    affection?: AffectionState[];
};

/**
 * Interface for chat storage adapters.
 * Handles persistence of chat sessions.
 */
export interface IChatStorageAdapter {
    /**
     * Initializes the storage adapter.
     */
    init(): Promise<void>;

    /**
     * Creates a new chat session.
     * @param characterId - The ID of the primary character for this chat.
     * @param title - The title of the chat.
     * @param chatType - Optional chat type ('direct', 'group', 'open'). Defaults to 'direct'.
     * @param participantIds - Optional array of additional participant character IDs for group/open chats.
     * @returns Promise resolving to the ID of the created chat.
     */
    createChat(
        characterId: string,
        title?: string,
        chatType?: ChatType,
        participantIds?: string[]
    ): Promise<string>;

    /**
     * Retrieves a chat session by ID.
     * @param id - The ID of the chat to retrieve.
     * @returns Promise resolving to the chat or undefined if not found.
     */
    getChat(id: string): Promise<LocalChat | undefined>;

    /**
     * Retrieves all chat sessions.
     * @returns Promise resolving to an array of chats.
     */
    getAllChats(): Promise<LocalChat[]>;

    /**
     * Retrieves chats for a specific character.
     * @param characterId - The ID of the character.
     * @returns Promise resolving to an array of chats for the character.
     */
    getChatsByCharacter(characterId: string): Promise<LocalChat[]>;
    /**
     * Retrieves all chats that include a specific character as a participant (for group/open chats).
     * @param characterId - The ID of the character.
     * @returns Promise resolving to an array of chats.
     */
    getChatsByParticipant(characterId: string): Promise<LocalChat[]>;

    /**
     * Updates chat metadata fields.
     * @param chatId - The ID of the chat to update.
     * @param updates - Partial chat fields to apply.
     */
    updateChat(chatId: string, updates: Partial<LocalChat>): Promise<void>;

    /**
     * Adds a message to a chat.
     * @param chatId - The ID of the chat.
     * @param message - The message to add.
     */
    addMessage(chatId: string, message: Message): Promise<void>;

    /**
     * Deletes a chat session by ID.
     * @param id - The ID of the chat to delete.
     */
    deleteChat(id: string): Promise<void>;

    /**
     * Retrieves all messages for a specific chat.
     * @param chatId - The ID of the chat.
     * @returns Promise resolving to an array of messages.
     */
    getMessages(chatId: string): Promise<Message[]>;

    /**
     * Updates a message's content.
     * @param chatId - The ID of the chat containing the message.
     * @param messageId - The ID of the message to update.
     * @param content - The new content for the message.
     */
    updateMessage(chatId: string, messageId: string, content: Message["content"]): Promise<void>;

    /**
     * Deletes a message by ID.
     * @param chatId - The ID of the chat containing the message.
     * @param messageId - The ID of the message to delete.
     */
    deleteMessage(chatId: string, messageId: string): Promise<void>;
}
