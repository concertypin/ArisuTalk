import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "$/prompts/builder/promptBuilder.js";
import { t } from "i18n.js";
import { ChatOpenAI } from "@langchain/openai";
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
    LLMApiGenerateProfileResponse,
} from "$/lib/api/llm/llmApiProto.js";

export class OpenAIClient implements LLMApi {
    client: ChatOpenAI;
    constructor(
        apiKey: string,
        model: string,
        baseUrl: string | null,
        options: LLMApiConstructorOptions | undefined = {}
    ) {
        this.client = new ChatOpenAI({
            apiKey: apiKey,
            model: model,
            maxTokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.8,
            configuration: {
                baseURL: baseUrl, // Default is handled by LangChain
            },
            ...options,
        });
    }

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
                messages.push(new HumanMessage(msg.parts[0].text));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.parts[0].text));
            }
        }

        try {
            const response = await this.client.invoke(messages);
            try {
                const parsedResponse = JSON.parse(String(response.content));
                if (
                    parsedResponse.messages &&
                    Array.isArray(parsedResponse.messages)
                ) {
                    return parsedResponse;
                }
            } catch (e) {
                return {
                    reactionDelay: 1000,
                    messages: [
                        { delay: 1000, content: String(response.content) },
                    ],
                };
            }

            throw new Error(t("api.invalidResponse", { provider: "OpenAI" }));
        } catch (error) {
            console.error("OpenAI API Error:", error);
            return { error: String(error) };
        }
    }

    async generateProfile({
        userName,
        userDescription,
    }: LLMApiGenerateProfileParams): LLMApiGenerateProfileResponse {
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
                messages.push(new HumanMessage(msg.parts[0].text));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.parts[0].text));
            }
        }

        try {
            const response = await this.client.invoke(messages);
            try {
                return JSON.parse(String(response.content));
            } catch (parseError) {
                console.error("Profile JSON 파싱 오류:", parseError);
                throw new Error(t("api.profileParseError"));
            }
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "OpenAI" }),
                error
            );
            return { error: String(error) };
        }
    }

    async generateCharacterSheet({
        characterName,
        characterDescription,
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
                messages.push(new HumanMessage(msg.parts[0].text));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.parts[0].text));
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
                t("api.profileGenerationError", { provider: "OpenAI" }) +
                    " (Character Sheet)",
                error
            );
            return { error: String(error) };
        }
    }
}

export default OpenAIClient;
