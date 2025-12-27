import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type ProviderType,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import { type BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Base class for chat providers that use LangChain.
 * Handles common logic for generation, streaming, and aborting.
 */
export abstract class LangChainBaseProvider<
    T extends ProviderType,
    SETTING extends CommonChatSettings & ProviderSettings[T] = CommonChatSettings &
        ProviderSettings[T],
> extends ChatProvider<T, SETTING> {
    protected abstract client: BaseChatModel;
    private abortController: AbortController | null = null;

    async disconnect(): Promise<void> {
        // HTTP-based providers usually don't need explicit disconnection
    }

    async generate(messages: BaseMessage[], _settings?: Partial<SETTING>): Promise<string> {
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
        _settings?: Partial<SETTING>
    ): AsyncGenerator<string, void, unknown> {
        this.abortController = new AbortController();

        try {
            const stream = await this.client.stream(messages, {
                signal: this.abortController.signal,
            });

            for await (const chunk of stream) {
                // Try chunk.content first (standard for most LangChain models)
                if (typeof chunk.content === "string") {
                    yield chunk.content;
                } else {
                    yield JSON.stringify(chunk.content);
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
}
