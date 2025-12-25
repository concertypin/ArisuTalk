import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

type OpenAISettings = CommonChatSettings & ProviderSettings["OPENAI"];

/**
 * OpenAI chat provider using @langchain/openai.
 *
 * Supports both official OpenAI API and OpenAI-compatible endpoints
 * (e.g., self-hosted models, Azure OpenAI) via the baseURL setting.
 */
export class OpenAIChatProvider extends ChatProvider<"OPENAI"> {
    id = "OPENAI";
    name = "OpenAI";
    description = "OpenAI GPT models (also supports OpenAI-compatible APIs)";

    private apiKey: string;
    private baseUrl: string | undefined;
    private modelName: string;
    private abortController: AbortController | null = null;
    private client: ChatOpenAI;

    private constructor(
        settings: OpenAISettings,
        ChatOpenAICtor: typeof import("@langchain/openai").ChatOpenAI
    ) {
        super();
        this.apiKey = settings.apiKey || "";
        this.baseUrl = settings.baseURL;
        this.modelName = settings.model || "gpt-4o-mini";
        this.client = new ChatOpenAICtor({
            model: this.modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxInputTokens,
            maxCompletionTokens: settings.generationParameters?.maxOutputTokens,
            configuration: {
                dangerouslyAllowBrowser: true,
                baseURL: this.baseUrl,
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

    async disconnect(): Promise<void> {
        // Nothing to close for HTTP API
    }

    async generate(messages: BaseMessage[], _settings?: Partial<OpenAISettings>): Promise<string> {
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
        _settings?: Partial<OpenAISettings>
    ): AsyncGenerator<string, void, unknown> {
        this.abortController = new AbortController();

        const stream = await this.client.stream(messages, {
            signal: this.abortController.signal,
        });

        try {
            for await (const chunk of stream) {
                const c = chunk?.content;
                if (typeof c === "string") {
                    yield c;
                } else if (c != null) {
                    try {
                        yield JSON.stringify(c);
                    } catch {
                        // skip non-serializable chunks
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
