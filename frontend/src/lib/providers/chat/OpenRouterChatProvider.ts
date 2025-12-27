import {
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { LangChainBaseProvider } from "./LangChainBaseProvider";
import type { ChatOpenAI } from "@langchain/openai";

type OpenRouterSettings = CommonChatSettings & ProviderSettings["OPENROUTER"];

/**
 * Minimal OpenRouter chat provider.
 *
 * This implements the same ChatProvider interface as other providers in the
 * project and speaks OpenAI-style chat completions to an OpenRouter endpoint.
 * It uses the standard fetch API and supports streaming via ReadableStream.
 */
export class OpenRouterChatProvider extends LangChainBaseProvider<"OPENROUTER"> {
    id = "OPENROUTER";
    name = "OpenRouter";
    description = "OpenRouter compatible models (OpenAI-style API)";

    private apiKey: string;
    protected client: ChatOpenAI;

    private constructor(
        settings: OpenRouterSettings,
        ChatOpenAICtor: typeof import("@langchain/openai").ChatOpenAI
    ) {
        super();
        this.apiKey = settings.apiKey || "";
        // Defaults to no-training free model
        const modelName = settings.model || "mistralai/devstral-2512:free";
        this.client = new ChatOpenAICtor({
            model: modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxInputTokens,
            maxCompletionTokens: settings.generationParameters?.maxOutputTokens,

            configuration: {
                baseURL: settings.baseURL || "https://api.openrouter.ai/v1",
                dangerouslyAllowBrowser: true,
                defaultHeaders: {
                    "HTTP-Referer": "https://arisutalk.moe",
                    "X-Title": "ArisuTalk",
                },
            },
        });
    }

    static factory: IChatProviderFactory<"OPENROUTER"> = {
        connect: async (settings: OpenRouterSettings) => {
            // Dynamically import to allow chunk-splitting and smaller initial bundles.
            const { ChatOpenAI } = await import("@langchain/openai");
            return new OpenRouterChatProvider(settings, ChatOpenAI);
        },
    };

    isReady(): boolean {
        return !!this.apiKey;
    }
}
