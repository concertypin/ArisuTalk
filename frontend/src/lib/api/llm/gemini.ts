import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "$root/prompts/builder/promptBuilder";
import { t } from "$root/i18n";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
    HumanMessage,
    SystemMessage,
    AIMessage,
    type BaseMessage,
} from "@langchain/core/messages";
import type {
    LLMApi,
    LLMApiConstructorOptions,
    LLMApiGenerateCharacterSheetParams,
    LLMApiGenerateCharacterSheetResponse,
    LLMApiGenerateContentParams,
    LLMApiGenerateProfileParams,
} from "$root/lib/api/llm/llmApiProto";

/**
 * Google Gemini API client class
 * Provides interface for AI conversation generation and character profile creation using Gemini API.
 */
export class GeminiClient implements LLMApi {
    client: ChatGoogleGenerativeAI;
    /**
     * Creates a GeminiClient instance.
     * @param {string} apiKey - Google Gemini API key
     * @param {string} model - Gemini model to use (e.g., 'gemini-2.5-flash')
     * @param {string} [baseUrl=null] - API base URL (not used with LangChain)
     * @param {Object} [options={}] - Client options
     * @param {number} [options.maxTokens=4096] - Maximum output tokens
     * @param {number} [options.temperature=1.25] - Response creativity control (0.0-2.0)
     * @param {number} [options.profileMaxTokens=1024] - Maximum tokens for profile generation
     * @param {number} [options.profileTemperature=1.2] - Temperature setting for profile generation
     */
    constructor(
        apiKey: string,
        model: string,
        baseUrl: string | null,
        options: LLMApiConstructorOptions | undefined = {}
    ) {
        this.client = new ChatGoogleGenerativeAI({
            apiKey: apiKey,
            model: model,
            baseUrl: baseUrl || undefined, //undefined handled by LangChain
            maxOutputTokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 1.25,
            ...options,
        });
    }

    /**
     * Generates conversation content with an AI character.
     * Creates character responses to user input and returns structured JSON response.
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
        isProactive = false,
        forceSummary = false,
        chatId = null,
    }: LLMApiGenerateContentParams) {
        // Determine chat type from chatId
        const isGroupChat =
            typeof chatId === "string" ? chatId.startsWith("group_") : false;
        const isOpenChat =
            typeof chatId === "string" ? chatId.startsWith("open_") : false;

        const { systemPrompt, contents } = await buildContentPrompt({
            userName,
            userDescription,
            character,
            history,
            isProactive,
            forceSummary,
            isGroupChat,
            isOpenChat,
        });

        const messages: BaseMessage[] = [];
        if (systemPrompt) {
            messages.push(new SystemMessage(systemPrompt));
        }
        for (const msg of contents) {
            if (msg.role === "user") {
                messages.push(new HumanMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            }
        }

        try {
            const response = await this.client.invoke(messages);

            // API 응답 구조 검증
            let parsed;
            try {
                // Clean up the response text to handle potential JSON formatting issues
                let cleanedText = String(response.content).trim();

                // Remove any potential markdown code blocks
                if (cleanedText.startsWith("```json")) {
                    cleanedText = cleanedText
                        .replace(/```json\s*/, "")
                        .replace(/\s*```$/, "");
                } else if (cleanedText.startsWith("```")) {
                    cleanedText = cleanedText
                        .replace(/```[^\n]*\n/, "")
                        .replace(/\n?```$/, "");
                }

                parsed = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error("JSON parsing error:", parseError);
                console.error("Original text:", response.content);
                console.error("Text length:", String(response.content).length);

                throw new Error(
                    t("api.geminiParsingError", {
                        error:
                            parseError instanceof Error
                                ? parseError.message
                                : String(parseError),
                    })
                );
            }

            parsed.reactionDelay = Math.max(0, parsed.reactionDelay || 0);
            return parsed;
        } catch (error) {
            console.error("Gemini API 호출 중 오류 발생:", error);
            if (
                error instanceof Error &&
                error.message.includes("User location is not supported")
            ) {
                return {
                    error: t("api.geminiLocationNotSupported"),
                };
            }
            return {
                error: t("api.geminiProcessingError", {
                    error:
                        error instanceof Error ? error.message : String(error),
                }),
            };
        }
    }

    /**
     * Generates an AI character profile based on user information.
     * Creates a new character's name and prompt based on the user's name and description.
     * @param {Object} params - Profile generation parameters
     * @param {string} params.userName - User name
     * @param {string} params.userDescription - User description/characteristics
     * @param {string} params.profileCreationPrompt - Prompt for profile creation
     * @returns {Promise<Object>} Generated profile information
     * @returns {string} returns.name - Generated character name
     * @returns {string} returns.prompt - Generated character prompt
     * @returns {string} [returns.error] - Error message if error occurs
     * @throws {Error} When API call fails or JSON parsing error occurs
     */
    async generateProfile({
        userName,
        userDescription,
        profileCreationPrompt,
    }: LLMApiGenerateProfileParams) {
        const { systemPrompt, contents } = await buildProfilePrompt({
            userName,
            userDescription,
        });

        const messages: BaseMessage[] = [];
        if (systemPrompt) {
            messages.push(new SystemMessage(systemPrompt));
        }
        for (const msg of contents) {
            if (msg.role === "user") {
                messages.push(new HumanMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            }
        }

        try {
            const response = await this.client.invoke(messages);

            // API 응답 구조 검증
            let parsed;
            try {
                // Clean up the response text to handle potential JSON formatting issues
                let cleanedText = String(response.content).trim();

                // Remove any potential markdown code blocks
                if (cleanedText.startsWith("```json")) {
                    cleanedText = cleanedText
                        .replace(/```json\s*/, "")
                        .replace(/\s*```$/, "");
                } else if (cleanedText.startsWith("```")) {
                    cleanedText = cleanedText
                        .replace(/```[^\n]*\n/, "")
                        .replace(/\n?```$/, "");
                }

                parsed = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error("JSON parsing error for profile:", parseError);
                console.error("Original text:", response.content);
                console.error("Text length:", String(response.content).length);
                console.error(
                    "Character at position 321:",
                    String(response.content).charAt(320)
                );
                console.error(
                    "Surrounding text:",
                    String(response.content).substring(310, 330)
                );

                throw new Error(
                    t("api.geminiParsingError", {
                        error:
                            parseError instanceof Error
                                ? parseError.message
                                : String(parseError),
                    })
                );
            }

            return parsed;
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "Gemini" }),
                error
            );
            return { error: String(error) };
        }
    }

    /**
     * Generates a character sheet using Gemini API.
     * @returns {Promise<Object>} Promise resolving to character sheet text response
     * @returns {Array} [returns.messages] - Array of response messages
     * @returns {string} [returns.error] - Error message if error occurs
     * @throws {Error} When API call fails or response processing error occurs
     */
    async generateCharacterSheet({
        characterName,
        characterDescription,
        characterSheetPrompt,
    }: LLMApiGenerateCharacterSheetParams): LLMApiGenerateCharacterSheetResponse {
        const { systemPrompt, contents } = await buildCharacterSheetPrompt({
            characterName,
            characterDescription,
        });

        const messages: BaseMessage[] = [];
        if (systemPrompt) {
            messages.push(new SystemMessage(systemPrompt));
        }
        for (const msg of contents) {
            if (msg.role === "user") {
                messages.push(new HumanMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            }
        }

        try {
            const response = await this.client.invoke(messages);

            return {
                messages: [{ content: String(response.content) }],
                reactionDelay: 1000,
            };
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "Gemini" }) +
                    " (Character Sheet)",
                error
            );
            return { error: String(error) };
        }
    }
}

export default GeminiClient;
