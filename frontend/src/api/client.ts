/**
 * @fileoverview Type declarations & abstract class & interfaces for common client functionalities.
 */


export type GenerateCharacterSheetParam = {
    characterName: string;
    characterDescription: string;
    characterSheetPrompt: string;
};
export type UserInfo = {
    // You know that. Read the name literally.
    userName: string;
    userDescription: string;
}

/**
 * Options for configuring the client behavior.
 *
 * @property maxTokens - The maximum number of tokens to generate in a response.
 * @property temperature - Sampling temperature for response generation (higher values mean more randomness).
 * @property profileMaxTokens - The maximum number of tokens for profile-specific responses.
 * @property profileTemperature - Sampling temperature for profile-specific responses.
 */
export type ClientOption = {
    maxTokens?: number;
    temperature?: number;
    profileMaxTokens?: number;
    profileTemperature?: number;
};

/**
 * Parameters required to generate a user profile.
 * Combines a profile creation prompt with user information.
 *
 * @property profileCreationPrompt - The prompt used to guide profile creation.
 * @property {UserInfo} - Additional user information fields inherited from the UserInfo type.
 */
export type GenerateProfileParam = {
    profileCreationPrompt: string;
} & UserInfo;

/**
 * Parameters for generating content in the application.
 *
 * @property character - The character object involved in the content generation.
 * @property history - An array representing the conversation or event history.
 * @property prompts - An object containing prompt data for content generation.
 * @property isProactive - Optional flag indicating if the generation should be proactive.
 * @property forceSummary - Optional flag to force a summary in the generated content.
 * @remarks
 * This type extends {@link UserInfo} to include user-related information.
 */
export type GenerateContentParam = {
    character: object;
    history: Array<any>;
    prompts: object;
    isProactive?: boolean;
    forceSummary?: boolean;
} & UserInfo;

/**
 * Abstract base class for AI client implementations.
 * Provides configuration options for model, API key, output tokens, and temperature settings.
 * Subclasses must implement methods for content generation, profile creation, and character sheet generation.
 */
export abstract class AIClientProto {
    temperature: number;
    profileMaxOutputTokens: number;
    profileTemperature: number;
    apiKey: string;
    model: string;
    maxOutputTokens: number;

    constructor(
        apiKey: string,
        model: string,
        options: { maxTokens?: number; temperature?: number; profileMaxTokens?: number; profileTemperature?: number; },
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.maxOutputTokens = options.maxTokens || 4096;
        this.temperature = options.temperature || 1.25;
        this.profileMaxOutputTokens = options.profileMaxTokens || 1024;
        this.profileTemperature = options.profileTemperature || 1.2;
    }
    /**
     * Generates AI-driven content based on user and character context.
     * @abstract
     * @returns A promise resolving to the generated content object.
    */
    abstract generateContent({ userName, userDescription, character, history, prompts, isProactive, forceSummary }: GenerateContentParam): Promise<object>

    /**
     * Generates a user profile using AI based on provided information and prompt.
     * @abstract
     * @returns A promise resolving to an object containing the profile name and prompt, or an error.
     */
    abstract generateProfile({ userName, userDescription, profileCreationPrompt }: GenerateProfileParam):
        Promise<{ name: string; prompt: string } | { error?: string }>
    /**
     * Generates a character sheet using AI based on character details and a prompt.
     * @abstract
     * @returns A promise resolving to an object containing generated messages or an error.
     */
    abstract generateCharacterSheet({
        characterName,
        characterDescription,
        characterSheetPrompt,
    }: GenerateCharacterSheetParam): Promise<{ messages: { content: string }[] } | { error?: string }>
}