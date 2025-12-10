/**
 * Represents the role of the message sender.
 */
export type Role = "user" | "assistant" | "system";

/**
 * Parameters for creating a Message instance.
 */
export type MessageParams = {
    /** Optional ID. If not provided, a UUID is generated. */
    id?: string;
    /** The role of the sender. */
    role: Role;
    /** The message content. */
    content: string;
    /** Optional creation timestamp. Defaults to now. */
    timestamp?: number;
};

/**
 * Represents a single message in a chat history.
 */
export class Message {
    /** Unique identifier for the message. */
    id: string;
    /** The role of the message sender. */
    role: Role;
    /** The content of the message. */
    content: string;
    /** The timestamp when the message was created. */
    timestamp: number;

    /**
     * Creates a new Message instance.
     * @param params - The initialization parameters.
     */
    constructor({ id, role, content, timestamp }: MessageParams) {
        this.id = id ?? crypto.randomUUID();
        this.role = role;
        this.content = content;
        this.timestamp = timestamp ?? Date.now();
    }
}

/**
 * Parameters for creating a Character instance.
 */
export type CharacterParams = {
    /** Optional ID. If not provided, a UUID is generated. */
    id?: string;
    /** The character name. */
    name: string;
    /** The character description. */
    description: string;
    /** The system instructions for the character. */
    persona: string;
    /** Optional avatar URL. */
    avatarUrl?: string;
};

/**
 * Represents a specific AI character personality.
 */
export class Character {
    /** Unique identifier for the character. */
    id: string;
    /** The display name of the character. */
    name: string;
    /** A short description of the character. */
    description: string;
    /** Optional URL for the character's avatar image. */
    avatarUrl?: string;
    /** System instructions defining the character's persona. */
    persona: string;

    /**
     * Creates a new Character instance.
     * @param params - The initialization parameters.
     */
    constructor({ id, name, description, persona, avatarUrl }: CharacterParams) {
        this.id = id ?? crypto.randomUUID();
        this.name = name;
        this.description = description;
        this.persona = persona;
        this.avatarUrl = avatarUrl;
    }
}

/**
 * Parameters for creating a Chat instance.
 */
export type ChatParams = {
    /** Optional ID. If not provided, a UUID is generated. */
    id?: string;
    /** The character ID. */
    characterId: string;
    /** Optional initial messages. Defaults to empty array. */
    messages?: Message[];
    /** Optional title. */
    title?: string;
    /** Optional creation time. Defaults to now. */
    createdAt?: number;
    /** Optional update time. Defaults to now. */
    updatedAt?: number;
};

/**
 * Represents a chat session with a character.
 */
export class Chat {
    /** Unique identifier for the chat session. */
    id: string;
    /** The ID of the character associated with this chat. */
    characterId: string;
    /** The list of messages in this chat. */
    messages: Message[];
    /** Optional title for the chat. */
    title?: string;
    /** creation timestamp. */
    createdAt: number;
    /** Last updated timestamp. */
    updatedAt: number;

    /**
     * Creates a new Chat instance.
     * @param params - The initialization parameters.
     */
    constructor({ id, characterId, messages, title, createdAt, updatedAt }: ChatParams) {
        this.id = id ?? crypto.randomUUID();
        this.characterId = characterId;
        this.messages = messages ?? [];
        this.title = title;
        this.createdAt = createdAt ?? Date.now();
        this.updatedAt = updatedAt ?? Date.now();
    }

    /**
     * Adds a new message to the chat and updates the timestamp.
     * @param message - The message to add.
     */
    addMessage(message: Message): void {
        this.messages.push(message);
        this.updatedAt = Date.now();
    }
}

/**
 * Represents application settings.
 */
export class Settings {
    /** application theme preference. */
    theme: "light" | "dark" | "system";
    /** Unique identifier for the user (device-specific). */
    userId: string;

    /**
     * Creates new Settings with defaults.
     */
    constructor() {
        this.theme = "system";
        this.userId = crypto.randomUUID();
    }
}
