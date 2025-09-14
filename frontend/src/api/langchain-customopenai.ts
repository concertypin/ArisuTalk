import { ChatOpenAI } from "@langchain/openai"
import {
    buildContentPrompt,
    buildProfilePrompt,
    buildCharacterSheetPrompt,
} from "../prompts/builder/promptBuilder.js";
import { t } from "../i18n.js";
import { toLangchainPrompt } from "../prompts/toLangchainPrompt.js";
import { generateContentSchema, profileGenerationSchema } from "../prompts/schema.js";
import { AIClientProto, GenerateCharacterSheetParam, GenerateContentParam, GenerateProfileParam } from "./client.js";



export class LangChainCustomOpenAIClient extends AIClientProto {
    client: ChatOpenAI;
    baseUrl: string;

    constructor(
        apiKey: string,
        model: string,
        baseUrl = "https://api.openai.com/v1",
        options: { maxTokens?: number; temperature?: number; profileMaxTokens?: number; profileTemperature?: number; } = {},
    ) {
        super(apiKey, model, options);
        this.baseUrl = baseUrl;

        this.client = new ChatOpenAI({
            modelName: this.model,
            apiKey: this.apiKey,
            configuration: {
                baseURL: this.baseUrl,
            },
            temperature: this.temperature,
            maxTokens: this.maxOutputTokens, // Set maxTokens for the client
            maxRetries: 1
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
    }: GenerateContentParam): Promise<object> {
        const messagePayload = toLangchainPrompt(await buildContentPrompt({
            userName,
            userDescription,
            //@ts-ignore
            character,
            history,
            //@ts-ignore
            prompts,
            isProactive,
            forceSummary,
        }))

        const model = this.client.withStructuredOutput(generateContentSchema);

        try {
            const data = await model.invoke(messagePayload);
            data.reactionDelay = Math.max(0, data.reactionDelay || 0);
            return data;
        } catch (e: any) {
            console.error("LangChain Custom OpenAI Content Gen Error:", e);
            return {
                error: t("api.customOpenAIError", { status: "Error", error: e.message }),
            };
        }
    }

    async generateProfile({ userName, userDescription, profileCreationPrompt }: GenerateProfileParam): Promise<{ name: string; prompt: string } | { error?: string }> {
        const messagePayload = toLangchainPrompt(await buildProfilePrompt({
            userName,
            userDescription,
            //@ts-ignore
            profileCreationPrompt,
        }));


        const model = this.client.withStructuredOutput(profileGenerationSchema);

        try {
            const data = await model.invoke(messagePayload);
            return data;
        } catch (e: any) {
            console.error("LangChain Custom OpenAI Profile Gen Error:", e);
            return {
                error: t("api.customOpenAIError", { status: "Error", error: e.message }),
            };
        }
    }

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
            return { messages: [{ content: response.text }] };
        } catch (e: any) {
            console.error(
                t("api.profileGenerationError", { provider: "Langchain-Custom OpenAI" }) +
                " (Character Sheet)",
                e,
            );
            return { error: e.message };
        }
    }
}
