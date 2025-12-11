import type { Chat, Settings } from "@/lib/types/IDataModel";
import type { Character } from "../types/Character";

/**
 * Interface for the storage adapter.
 * Handles persistence of chats, characters, and settings using local storage mechanisms (IndexedDB/OpFS).
 */
export interface IStorageAdapter {
    /**
     * Initializes the storage adapter (e.g., opens DB connection).
     */
    init(): Promise<void>;

    /**
     * Saves a chat session to storage.
     * @param chat - The chat session to save.
     */
    saveChat(chat: Chat): Promise<void>;

    /**
     * Retrieves a chat session by ID.
     * @param id - The ID of the chat to retrieve.
     * @returns Promise resolving to the chat or undefined if not found.
     */
    getChat(id: string): Promise<Chat | undefined>;

    /**
     * Retrieves all stored chat sessions.
     * @returns Promise resolving to an array of chats.
     */
    getAllChats(): Promise<Chat[]>;

    /**
     * Deletes a chat session by ID.
     * @param id - The ID of the chat to delete.
     */
    deleteChat(id: string): Promise<void>;

    /**
     * Saves a character profile to storage.
     * @param character - The character to save.
     */
    saveCharacter(character: Character): Promise<void>;

    /**
     * Retrieves a character profile by ID.
     * @param id - The ID of the character to retrieve.
     * @returns Promise resolving to the character or undefined if not found.
     */
    getCharacter(id: string): Promise<Character | undefined>;

    /**
     * Retrieves all stored character profiles.
     * @returns Promise resolving to an array of characters.
     */
    getAllCharacters(): Promise<Character[]>;

    /**
     * Deletes a character profile by ID.
     * @param id - The ID of the character to delete.
     */
    deleteCharacter(id: string): Promise<void>;

    /**
     * Saves application settings.
     * @param settings - The settings object to save.
     */
    saveSettings(settings: Settings): Promise<void>;

    /**
     * Retrieves application settings.
     * @returns Promise resolving to the settings object.
     */
    getSettings(): Promise<Settings>;

    /**
     * Exports all data as a readable stream.
     * Useful for creating backups of large datasets.
     * @returns Promise resolving to a ReadableStream of Uint8Array.
     */
    exportData(): Promise<ReadableStream<Uint8Array>>;

    /**
     * Imports data from a readable stream.
     * Restores data from a backup.
     * @param stream - The stream containing the data to import.
     */
    importData(stream: ReadableStream<Uint8Array>): Promise<void>;
}
