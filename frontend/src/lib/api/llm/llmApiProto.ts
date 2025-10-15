import type { Character } from "$/types/character";

export type LLMApiGenerateContentParams = {
    /**
     * User name
     */
    userName: string;
    /**
     * User description/persona
     */
    userDescription: string;
    /**
     * Character information
     */
    character: Character;
    /**
     * Conversation history
     * It has not been typed strictly.
     * @todo Define the type properly.
     */
    history: Array<object>;
    /**
     * Prompt settings
     * It has not been typed strictly.
     * @todo Define the type properly.
     */
    prompts: object;
    /**
     * Whether this is a proactive message
     * If true, the character initiates the conversation without user input.
     * @default false
     */
    isProactive?: boolean;
    /**
     * Whether to force summary
     * If true, forces the model to summarize the conversation history.
     * @default false
     */
    forceSummary?: boolean;
    /**
     * Chat ID for tracking conversation context
     * This is used to maintain context in multi-turn conversations.
     */
    chatId: string | null;
};

export type LLMApiGenerateProfileParams = {
    /**
     * User name
     */
    userName: string;
    /**
     * User description/persona
     */
    userDescription: string;
    /**
     * Prompt for profile creation
     */
    profileCreationPrompt: string;
};

export type LLMApiGenerateCharacterSheetParams = {
    /**
     * Character name
     * E.g., "Alice"
     */
    characterName: string;
    /**
     * Character description
     */
    characterDescription: string;
    /**
     * Prompt template for character sheet generation
     */
    characterSheetPrompt: string;
};

export type LLMApiGenerateProfileResponse = Promise<
    | {
          name: string;
          prompt: string;
      }
    | {
          error: string;
      }
>;

export type LLMApiGenerateCharacterSheetResponse = Promise<
    | {
          /**
           * Array of response messages
           * It has not been typed strictly.
           * @todo Define the type properly.
           */
          messages: any[];
          /**
           * Reaction delay time in milliseconds
           * It seems sometimes not to be included in the response.
           * @todo Confirm and fix if necessary.
           */
          reactionDelay?: number;
      }
    | {
          /**
           * @todo Use rejected Promise instead
           */
          error: string;
      }
>;

export interface LLMApiConstructorOptions {
    /**
     * Maximum output tokens
     * @default 4096
     */
    maxTokens?: number;
    /**
     * Response creativity control (0.0-2.0)
     * @default 1.25
     */
    temperature?: number;
    /**
     * Maximum tokens for profile generation
     * @default 1024
     */
    profileMaxTokens?: number;
    /**
     * Temperature setting for profile generation (0.0-2.0)
     * @default 1.2
     */
    profileTemperature?: number;
}
export interface LLMApiConstructor {
    /**
     * Creates a GeminiClient instance.
     * @param apiKey - Google Gemini API key
     * @param model - Gemini model to use (e.g., 'gemini-2.5-flash')
     * @param baseUrl - API base URL (not used with LangChain)
     * @param options - Client options
     */
    new (
        apiKey: string,
        model: string,
        baseUrl: string | null,
        options?: LLMApiConstructorOptions
    ): LLMApi;
}
export interface LLMApi {
    /**
     * Generates conversation content with an AI character.
     * Creates character responses to user input and returns structured JSON response.
     * @param params - Content generation parameters
     * @returns {Promise<Object>} Generated response object
     * @returns {number} returns.reactionDelay - Reaction delay time (milliseconds)
     * @returns {Array<Object>} returns.messages - Generated message array
     * @returns {Object} [returns.characterState] - Character state
     * @throws {Error} When API call fails or JSON parsing error occurs
     */
    generateContent(params: LLMApiGenerateContentParams): Promise<{
        reactionDelay: number;
        messages: Array<Object>;
        characterState: Object;
    }>;

    /**
     * Generates an AI character profile based on user information.
     * Creates a new character's name and prompt based on the user's name and description.
     * @param params - Profile generation parameters
     * @returns {Promise<Object>} Generated profile information
     * @returns {string} returns.name - Generated character name
     * @returns {string} returns.prompt - Generated character prompt
     * @returns {string} [returns.error] - Error message if error occurs
     * @throws {Error} When API call fails or JSON parsing error occurs
     */
    generateProfile(
        params: LLMApiGenerateProfileParams
    ): LLMApiGenerateProfileResponse;
    /**
     * Generates a character sheet using Gemini API.
     * @param  params - Generation parameters
     * @returns {Promise<Object>} Promise resolving to character sheet text response
     * @returns {Array} [returns.messages] - Array of response messages
     * @returns {string} [returns.error] - Error message if error occurs
     * @throws {Error} When API call fails or response processing error occurs
     */
    generateCharacterSheet(
        params: LLMApiGenerateCharacterSheetParams
    ): LLMApiGenerateCharacterSheetResponse;
}
