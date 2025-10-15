import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "$/prompts/builder/promptBuilder";
import { t } from "$/i18n.js";
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
} from "$/lib/api/llm/llmApiProto";

const API_BASE_URL = "https://openrouter.ai/api/v1";

export class OpenRouterClient implements LLMApi {
    client: ChatOpenAI;
    constructor(
        apiKey: string,
        model: string,
        baseUrl: string | null = API_BASE_URL,
        options: LLMApiConstructorOptions | undefined = {}
    ) {
        this.client = new ChatOpenAI({
            apiKey: apiKey,
            model: model,
            maxTokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.8,
            configuration: {
                baseURL: baseUrl || API_BASE_URL,
            },
            ...options,
        });
    }

    async generateContent({
        userName,
        userDescription,
        character,
        history,
        prompts,
        isProactive = false,
        forceSummary = false,
        chatId = null,
    }: LLMApiGenerateContentParams) {
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
            const response = await this.client
                .withConfig({ response_format: { type: "json_object" } })
                .invoke(messages);

            try {
                const parsedResponse = JSON.parse(response.text);
                if (
                    parsedResponse.messages &&
                    Array.isArray(parsedResponse.messages)
                ) {
                    return parsedResponse;
                }
            } catch (e) {
                return {
                    reactionDelay: 1000,
                    messages: [{ delay: 1000, content: response.content }],
                };
            }

            throw new Error(
                t("api.invalidResponse", { provider: "OpenRouter" })
            );
        } catch (error) {
            console.error("OpenRouter API Error:", error);
            return { error: String(error) };
        }
    }

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
                messages.push(new HumanMessage(msg.parts[0].text));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.parts[0].text));
            }
        }

        try {
            const response = await this.client
                .withConfig({ response_format: { type: "json_object" } })
                .invoke(messages);
            try {
                return JSON.parse(response.text);
            } catch (parseError) {
                console.error("Profile JSON 파싱 오류:", parseError);
                throw new Error(t("api.profileParseError"));
            }
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "OpenRouter" }),
                error
            );
            return { error: String(error) };
        }
    }

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
                messages.push(new HumanMessage(msg.parts[0].text));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(msg.parts[0].text));
            }
        }

        try {
            const response = await this.client
                .withConfig({ response_format: { type: "json_object" } })
                .invoke(messages);

            return {
                messages: [{ content: response.content }],
                reactionDelay: 1000,
            };
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "OpenRouter" }) +
                    " (Character Sheet)",
                error
            );
            return { error: String(error) };
        }
    }
}
export default OpenRouterClient;
