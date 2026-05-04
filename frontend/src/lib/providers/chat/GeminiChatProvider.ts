import {
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { LangChainBaseProvider } from "./LangChainBaseProvider";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";

type GeminiSettings = CommonChatSettings & ProviderSettings["GEMINI"];

export class GeminiChatProvider extends LangChainBaseProvider<"GEMINI"> {
    id = "GEMINI";
    name = "Google Gemini";
    description = "Google's Gemini models";

    protected client: ChatGoogleGenerativeAI;

    private constructor(client: ChatGoogleGenerativeAI) {
        super();
        this.client = client;
    }

    static factory: IChatProviderFactory<"GEMINI"> = {
        async connect(settings: GeminiSettings) {
            const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
            type ClientOption = ConstructorParameters<typeof ChatGoogleGenerativeAI>["0"];
            type SafetySetting = Required<ClientOption>["safetySettings"][number];
            if (!settings.model) {
                throw new Error("Model must be specified for GeminiChatProvider.");
            }
            const modelConfig: ClientOption = {
                apiKey: settings.apiKey,
                model: settings.model,
                temperature: settings.generationParameters?.temperature,
                maxOutputTokens: settings.generationParameters?.maxOutputTokens,
                safetySettings: settings.safetySettings?.map(
                    (i): SafetySetting => ({
                        // oxlint-disable-next-line typescript-eslint/consistent-type-assertions -- external SDK types do not line up exactly here.
                        category: i.category as unknown as SafetySetting["category"],
                        // oxlint-disable-next-line typescript-eslint/consistent-type-assertions -- external SDK types do not line up exactly here.
                        threshold: i.threshold as unknown as SafetySetting["threshold"],
                    })
                ),
                thinkingConfig: {
                    includeThoughts: true,
                },
            };
            if (typeof settings.generationParameters?.thinkingLevel === "string") {
                modelConfig.thinkingConfig = {
                    ...modelConfig.thinkingConfig,
                    // oxlint-disable-next-line typescript-eslint/consistent-type-assertions -- external SDK type alias differs from our config union.
                    thinkingLevel: settings.generationParameters.thinkingLevel as unknown as Required<ClientOption>["thinkingConfig"]["thinkingLevel"],
                };
            } else if (typeof settings.generationParameters?.thinkingLevel === "number") {
                modelConfig.thinkingConfig = {
                    ...modelConfig.thinkingConfig,
                    thinkingBudget: settings.generationParameters.thinkingLevel,
                };
            } else if (settings.generationParameters?.thinkingLevel === undefined) {
                // Do nothing, use default
            } else {
                // Fallback, should not reach here due to prior check
                throw new Error("Invalid thinkingLevel for GeminiChatProvider.");
            }
            const client = new ChatGoogleGenerativeAI(modelConfig);
            return new GeminiChatProvider(client);
        },
    };

    isReady(): boolean {
        return !!this.client;
    }
}
