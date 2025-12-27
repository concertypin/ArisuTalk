import {
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { LangChainBaseProvider } from "./LangChainBaseProvider";
import type { ChatAnthropic as ChatAnthropicType } from "@langchain/anthropic";

type AnthropicSettings = CommonChatSettings & ProviderSettings["ANTHROPIC"];

/**
 * Anthropic Claude chat provider using @langchain/anthropic.
 */
export class AnthropicChatProvider extends LangChainBaseProvider<"ANTHROPIC"> {
    id = "ANTHROPIC";
    name = "Anthropic";
    description = "Anthropic Claude models";

    private apiKey: string;
    protected client: ChatAnthropicType;

    private constructor(
        settings: AnthropicSettings,
        ChatAnthropicCtor: typeof import("@langchain/anthropic").ChatAnthropic
    ) {
        super();
        this.apiKey = settings.apiKey || "";
        const modelName = settings.model || "claude-sonnet-4-5-20250929";
        this.client = new ChatAnthropicCtor({
            model: modelName,
            temperature: settings.generationParameters?.temperature,
            streaming: true,
            apiKey: settings.apiKey,
            maxTokens: settings.generationParameters?.maxOutputTokens ?? 4096,
            // Anthropic requires dangerouslyAllowBrowser for browser usage
            clientOptions: {
                dangerouslyAllowBrowser: true,
            },
        });
    }

    static factory: IChatProviderFactory<"ANTHROPIC"> = {
        connect: async (settings: AnthropicSettings) => {
            // Dynamically import to allow chunk-splitting and smaller initial bundles.
            const { ChatAnthropic } = await import("@langchain/anthropic");
            return new AnthropicChatProvider(settings, ChatAnthropic);
        },
    };

    isReady(): boolean {
        return !!this.apiKey;
    }
}
