import type { Message } from "@arisutalk/character-spec/v0/Character/Message";
import type { Chat } from "@arisutalk/character-spec/v0/Character";

export type LocalChat = Chat & {
    name: string;
    lastMessage: number;
    characterId: string;
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
     * @param characterId - The ID of the character for this chat.
     * @param title - The title of the chat.
     * @returns Promise resolving to the ID of the created chat.
     */
    createChat(characterId: string, title?: string): Promise<string>;

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
}
