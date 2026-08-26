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
            type SafetySettingCat = SafetySetting["category"];
            type SafetySettingThresh = SafetySetting["threshold"];
            type ThinkingLevel = Required<ClientOption>["thinkingConfig"]["thinkingLevel"];

            // type-only narrowing — our Zod schemas define the exact same
            // literal values the SDK expects, so a pass-through suffices.
            const narrow = <A, B>(v: A): B => v as unknown as B;

            if (!settings.model) {
                throw new Error("Model must be specified for GeminiChatProvider.");
            }

            const modelConfig: ClientOption = {
                apiKey: settings.apiKey,
                model: settings.model ?? "",
                temperature: settings.generationParameters?.temperature,
                safetySettings: settings.safetySettings?.map((i): SafetySetting => ({
                    category: narrow<string, SafetySettingCat>(i.category),
                    threshold: narrow<string, SafetySettingThresh>(i.threshold),
                })),
                thinkingConfig: { includeThoughts: true },
            };
            if (typeof settings.generationParameters?.thinkingLevel === "string") {
                modelConfig.thinkingConfig = {
                    ...modelConfig.thinkingConfig,
                    thinkingLevel: narrow<string, ThinkingLevel>(
                        settings.generationParameters.thinkingLevel
                    ),
                };
            } else if (typeof settings.generationParameters?.thinkingLevel === "number") {
                modelConfig.thinkingConfig = {
                    ...modelConfig.thinkingConfig,
                    thinkingBudget: settings.generationParameters.thinkingLevel,
                };
            }
            return new GeminiChatProvider(new ChatGoogleGenerativeAI(modelConfig));
        },
    };

    isReady(): boolean {
        return !!this.client;
    }
}
