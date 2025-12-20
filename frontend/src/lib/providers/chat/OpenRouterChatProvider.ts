import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

type OpenRouterSettings = CommonChatSettings & ProviderSettings["OPENROUTER"];

/**
 * Minimal OpenRouter chat provider.
 *
 * This implements the same ChatProvider interface as other providers in the
 * project and speaks OpenAI-style chat completions to an OpenRouter endpoint.
 * It uses the standard fetch API and supports streaming via ReadableStream.
 */
export class OpenRouterChatProvider extends ChatProvider<"OPENROUTER"> {
    id = "OPENROUTER";
    name = "OpenRouter";
    description = "OpenRouter compatible models (OpenAI-style API)";

    private apiKey: string;
    private baseUrl: string;
    private modelName: string;
    private abortController: AbortController | null = null;
    private client: ChatOpenAI;

    private constructor(
        settings: OpenRouterSettings,
        ChatOpenAICtor: typeof import("@langchain/openai").ChatOpenAI
    ) {
        super();
        this.apiKey = settings.apiKey || "";
        this.baseUrl = settings.baseUrl || "https://api.openrouter.ai/v1";
        // Defaults to no-training free model
        this.modelName = settings.model || "mistralai/devstral-2512:free";
        this.client = new ChatOpenAICtor({
            model: this.modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxInputTokens,
            maxCompletionTokens: settings.generationParameters?.maxOutputTokens,

            configuration: {
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

    async disconnect(): Promise<void> {
        // Nothing to close for HTTP API
    }

    async generate(
        messages: BaseMessage[],
        _settings?: Partial<OpenRouterSettings>
    ): Promise<string> {
        // Use LangChain client to produce a non-streaming response
        // If per-request settings are provided, we could recreate the client, but
        // for simplicity we use the existing client and rely on its configuration.
        const response = await this.client.invoke(messages);
        const content = response.content;
        if (typeof content === "string") return content;
        if (content == null) return "";
        try {
            return JSON.stringify(content);
        } catch {
            return "";
        }
    }

    async *stream(
        messages: BaseMessage[],
        _settings?: Partial<OpenRouterSettings>
    ): AsyncGenerator<string, void, unknown> {
        this.abortController = new AbortController();

        // Use LangChain client's streaming interface
        const stream = await this.client.stream(messages, {
            signal: this.abortController.signal,
        });

        try {
            for await (const chunk of stream) {
                // chunk may have a `content` property similar to other chat models
                const c = chunk?.content;
                if (typeof c === "string") {
                    yield c;
                } else if (c != null) {
                    try {
                        yield JSON.stringify(c);
                    } catch {
                        // fallback: skip non-serializable chunks
                    }
                }
            }
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
            throw error;
        } finally {
            this.abortController = null;
        }
    }

    abort(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    isReady(): boolean {
        return !!this.apiKey;
    }
}
