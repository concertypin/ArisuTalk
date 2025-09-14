import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "../prompts/builder/promptBuilder.js";
import { t } from "../i18n.js";
import { SystemMessage } from "@langchain/core/messages";
import { toLangchainPrompt } from "../prompts/toLangchainPrompt.js";
import { generateContentSchema, profileGenerationSchema } from "../prompts/schema.js";
import { ClientOption, UserInfo, GenerateCharacterSheetParam, AIClientProto, GenerateContentParam, GenerateProfileParam } from "./client.js";


/**
 * Google Gemini API client class
 * Provides interface for AI conversation generation and character profile creation using Gemini API.
 */
export class LangChainGeminiClient extends AIClientProto {
    client: ChatGoogleGenerativeAI
    /**
     * Creates a GeminiClient instance.
     * @param apiKey - Google Gemini API key
     * @param model - Gemini model to use (e.g., 'gemini-2.5-flash')
     * @param options - Client options
     */
    constructor(apiKey: string, model: string, options: ClientOption = {}) {
        super(apiKey, model, options);

        this.client = new ChatGoogleGenerativeAI({
            model: model,
            apiKey: apiKey,
            temperature: options.temperature,
            topK: 40,
            topP: 0.95,
            // All safety setting disable
            safetySettings: Object.values(HarmCategory).map(i => ({ category: i, threshold: HarmBlockThreshold.BLOCK_NONE }))
        })
    }

    /**
     * Generates conversation content with an AI character.
     * Creates character responses to user input and returns structured JSON response.
     * @param {Object} params - Content generation parameters
     * @param {Object} params.character - Character information
     * @param {Array} params.history - Conversation history
     * @param {Object} params.prompts - Prompt settings
     * @param {boolean} [params.isProactive=false] - Whether this is a proactive message
     * @param {boolean} [params.forceSummary=false] - Whether to force summary
     * @returns {Promise<Object>} Generated response object
     * @returns {number} returns.reactionDelay - Reaction delay time (milliseconds)
     * @returns {Array<Object>} returns.messages - Generated message array
     * @returns {Object} [returns.characterState] - Character state
     * @throws {Error} When API call fails or JSON parsing error occurs
     */
    async generateContent({
        userName,
        userDescription,
        character,
        history,
        prompts,
        isProactive = false,
        forceSummary = false,
    }: GenerateContentParam): Promise<object> {
        const { contents, systemPrompt } = await buildContentPrompt({
            userName,
            userDescription,
            character,
            history,
            //@ts-ignore
            prompts,
            isProactive,
            forceSummary,
        });

        const messagePayload = [new SystemMessage(systemPrompt), ...contents]
        const model = this.client.withStructuredOutput(generateContentSchema)
        try {
            const data = await model.invoke(messagePayload)

            data.reactionDelay = Math.max(0, data.reactionDelay || 0);
            return data;
        }
        catch (e) {
            return {
                error: t("api.geminiProcessingError", { error: e }),
            };

        }
    }

    /**
     * Generates an AI character profile based on user information.
     * Creates a new character's name and prompt based on the user's name and description.
     * @param {Object} params - Profile generation parameters
     * @param {string} params.profileCreationPrompt - Prompt for profile creation
     * @returns {Promise<Object>} Generated profile information
     * @returns {string} returns.name - Generated character name
     * @returns {string} returns.prompt - Generated character prompt
     * @returns {string} [returns.error] - Error message if error occurs
     * This never throws. It always returns an object with an error field on failure.
     */
    async generateProfile({ userName, userDescription, profileCreationPrompt }: GenerateProfileParam): Promise<{ name: string; prompt: string } | { error?: string }> {
        const { systemPrompt, contents } = await buildProfilePrompt({
            userName,
            userDescription,
            //@ts-ignore
            profileCreationPrompt,
        });

        const messagePayload = [new SystemMessage(systemPrompt), ...contents]
        const model = this.client.withStructuredOutput(profileGenerationSchema, {
            // LangChain's structured output doesn't directly support responseMimeType or responseSchema
            // It infers the schema from the Zod object.
            // Safety settings are already applied at the client level in the constructor.
            // Temperature and maxOutputTokens can be set on the model instance if needed,
            // but for structured output, it's often handled by the underlying model.
        })
        try {
            const data = await model.invoke(messagePayload)
            return {
                name: data.name.trim(),
                prompt: data.prompt.trim()
            };
        }
        catch (e) {
            return {
                error: t("api.geminiProcessingError", { error: e }),
            };
        }
    }

    /**
     * Generates a character sheet using Gemini API.
     * @param {object} params - Generation parameters
     * @param params.characterName - Character name
     * @param params.characterDescription - Character description
     * @param params.characterSheetPrompt - Template for character sheet generation
     * @returns {Promise<Object>} Promise resolving to character sheet text response
     * @returns {Array} [returns.messages] - Array of response messages
     * @returns {string} [returns.error] - Error message if error occurs
     * This never throws. It always returns an object with an error field on failure.
     */
    async generateCharacterSheet({
        characterName,
        characterDescription,
        characterSheetPrompt,
    }: GenerateCharacterSheetParam): Promise<{ messages: { content: string }[] } | { error?: string }> {
        const messagePayload = toLangchainPrompt(await buildCharacterSheetPrompt({
            characterName,
            characterDescription,
            //@ts-ignore
            characterSheetPrompt,
        }))
        try {
            const response = await this.client.invoke(messagePayload);
            // Assuming the response content is directly in the 'content' field for text output
            return { messages: [{ content: response.text }] };
        } catch (e: any) {
            console.error(
                t("api.profileGenerationError", { provider: "Langchain-gemini" }) +
                " (Character Sheet)",
                e,
            );
            return { error: e.message };
        }
    }
}
