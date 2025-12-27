import {
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { LangChainBaseProvider } from "./LangChainBaseProvider";
import type { ChatOpenAI } from "@langchain/openai";

type OpenAISettings = CommonChatSettings & ProviderSettings["OPENAI"];

/**
 * OpenAI chat provider using @langchain/openai.
 *
 * Supports both official OpenAI API and OpenAI-compatible endpoints
 * (e.g., self-hosted models, Azure OpenAI) via the baseURL setting.
 */
export class OpenAIChatProvider extends LangChainBaseProvider<"OPENAI"> {
    id = "OPENAI";
    name = "OpenAI";
    description = "OpenAI GPT models (also supports OpenAI-compatible APIs)";

    private apiKey: string;
    protected client: ChatOpenAI;

    private constructor(
        settings: OpenAISettings,
        ChatOpenAICtor: typeof import("@langchain/openai").ChatOpenAI
    ) {
        super();
        this.apiKey = settings.apiKey || "";
        const modelName = settings.model || "gpt-4o-mini";
        this.client = new ChatOpenAICtor({
            model: modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxInputTokens,
            maxCompletionTokens: settings.generationParameters?.maxOutputTokens,
            configuration: {
                dangerouslyAllowBrowser: true,
                baseURL: settings.baseURL,
            },
        });
    }

    static factory: IChatProviderFactory<"OPENAI"> = {
        connect: async (settings: OpenAISettings) => {
            // Dynamically import to allow chunk-splitting and smaller initial bundles.
            const { ChatOpenAI } = await import("@langchain/openai");
            return new OpenAIChatProvider(settings, ChatOpenAI);
        },
    };

    isReady(): boolean {
        return !!this.apiKey;
    }
}
