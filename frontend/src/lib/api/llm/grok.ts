import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "$root/prompts/builder/promptBuilder";
import { t } from "$root/i18n";
import { ChatGroq } from "@langchain/groq";
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

export class GrokClient implements LLMApi {
    client: ChatGroq;
    constructor(
        apiKey: string,
        model: string,
        baseUrl: string | null,
        options: LLMApiConstructorOptions | undefined = {}
    ) {
        this.client = new ChatGroq({
            apiKey: apiKey,
            model: model,
            maxTokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.8,
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

            throw new Error(t("api.invalidResponse", { provider: "Grok" }));
        } catch (error) {
            console.error("Grok API Error:", error);
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
                messages.push(new HumanMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
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
                t("api.profileGenerationError", { provider: "Grok" }),
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
                t("api.profileGenerationError", { provider: "Grok" }) +
                    " (Character Sheet)",
                error
            );
            return { error: String(error) };
        }
    }
}

export default GrokClient;
