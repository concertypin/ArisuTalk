import {
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { LangChainBaseProvider } from "./LangChainBaseProvider";
import type { ChatOpenAI } from "@langchain/openai";

type GrokSettings = CommonChatSettings & ProviderSettings["GROK"];
type ChatOpenAICtor = typeof ChatOpenAI;

/**
 * Grok (xAI) chat provider using @langchain/openai.
 *
 * xAI's Grok API is OpenAI-compatible, so this reuses the ChatOpenAI
 * LangChain integration pointed at api.x.ai.
 */
export class GrokChatProvider extends LangChainBaseProvider<"GROK"> {
    id = "GROK";
    name = "Grok";
    description = "Grok (xAI) models via OpenAI-compatible API";

    private apiKey: string;
    protected client: ChatOpenAI;

    private constructor(settings: GrokSettings, ChatOpenAICtor: ChatOpenAICtor) {
        super();
        this.apiKey = settings.apiKey || "";
        const modelName = settings.model || "grok-3-mini";
        this.client = new ChatOpenAICtor({
            model: modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxInputTokens,
            maxCompletionTokens: settings.generationParameters?.maxOutputTokens,
            configuration: {
                baseURL: settings.baseURL || "https://api.x.ai/v1",
                dangerouslyAllowBrowser: true,
            },
        });
    }

    static factory: IChatProviderFactory<"GROK"> = {
        connect: async (settings: GrokSettings) => {
            // Dynamically import to allow chunk-splitting and smaller initial bundles.
            const { ChatOpenAI } = await import("@langchain/openai");
            return new GrokChatProvider(settings, ChatOpenAI);
        },
    };

    isReady(): boolean {
        return !!this.apiKey;
    }
}
