import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "$root/prompts/builder/promptBuilder";
import { t } from "$root/i18n";
import { ChatAnthropic } from "@langchain/anthropic";
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
} from "$root/lib/api/llm/llmApiProto";

export class ClaudeClient implements LLMApi {
    client: ChatAnthropic;
    constructor(
        apiKey: string,
        model: string,
        baseUrl: string | null,
        options: LLMApiConstructorOptions | undefined = {}
    ) {
        this.client = new ChatAnthropic({
            apiKey: apiKey,
            model: model,
            maxTokens: options?.maxTokens ?? 4096,
            temperature: options?.temperature ?? 0.8,
            anthropicApiUrl: baseUrl || undefined,
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

            throw new Error(t("api.invalidResponse", { provider: "Claude" }));
        } catch (error) {
            console.error("Claude API Error:", error);
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
                messages.push(new HumanMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            } else if (msg.role === "assistant") {
                messages.push(new AIMessage(('text' in msg.parts[0] ? msg.parts[0].text : "")));
            }
        }

        try {
            const response = await this.client.invoke(messages);
            try {
                return JSON.parse(response.text);
            } catch (parseError) {
                console.error("Profile JSON 파싱 오류:", parseError);
                throw new Error(t("api.profileParseError"));
            }
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "Claude" }),
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
                messages: [{ content: response.content }],
                reactionDelay: 1000,
            };
        } catch (error) {
            console.error(
                t("api.profileGenerationError", { provider: "Claude" }) +
                    " (Character Sheet)",
                error
            );
            return { error: String(error) };
        }
    }
}

export default ClaudeClient;
