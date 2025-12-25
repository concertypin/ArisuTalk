import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import type { ChatAnthropic as ChatAnthropicType } from "@langchain/anthropic";

type AnthropicSettings = CommonChatSettings & ProviderSettings["ANTHROPIC"];

/**
 * Anthropic Claude chat provider using @langchain/anthropic.
 */
export class AnthropicChatProvider extends ChatProvider<"ANTHROPIC"> {
    id = "ANTHROPIC";
    name = "Anthropic";
    description = "Anthropic Claude models";

    private apiKey: string;
    private modelName: string;
    private abortController: AbortController | null = null;
    private client: ChatAnthropicType;

    private constructor(
        settings: AnthropicSettings,
        ChatAnthropicCtor: typeof import("@langchain/anthropic").ChatAnthropic
    ) {
        super();
        this.apiKey = settings.apiKey || "";
        this.modelName = settings.model || "claude-sonnet-4-20250514";
        this.client = new ChatAnthropicCtor({
            model: this.modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxOutputTokens ?? 4096,
            // Anthropic requires dangerouslyAllowBrowser for browser usage
            dangerouslyAllowBrowser: true,
        });
    }

    static factory: IChatProviderFactory<"ANTHROPIC"> = {
        connect: async (settings: AnthropicSettings) => {
            // Dynamically import to allow chunk-splitting and smaller initial bundles.
            const { ChatAnthropic } = await import("@langchain/anthropic");
            return new AnthropicChatProvider(settings, ChatAnthropic);
        },
    };

    async disconnect(): Promise<void> {
        // Nothing to close for HTTP API
    }

    async generate(
        messages: BaseMessage[],
        _settings?: Partial<AnthropicSettings>
    ): Promise<string> {
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
        _settings?: Partial<AnthropicSettings>
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
