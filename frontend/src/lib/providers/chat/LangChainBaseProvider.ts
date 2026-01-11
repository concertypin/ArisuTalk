import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type ProviderType,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import { type BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Logger } from "@common/logger/Logger";

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
        const startTime = Date.now();
        Logger.structured("llm.request.start", {
            provider: this.id,
        });
        try {
            const response = await this.client.invoke(messages);
            const content = response.content;
            Logger.structured("llm.request.complete", {
                provider: this.id,
                latencyMs: Date.now() - startTime,
            });
            if (typeof content === "string") return content;
            if (content == null) return "";
            try {
                return JSON.stringify(content);
            } catch {
                return "";
            }
        } catch (error: unknown) {
            Logger.structured("llm.request.error", {
                provider: this.id,
                errorType: (error as Error).name || "Error",
                errorMessage: (error as Error).message || String(error),
            });
            throw error;
        }
    }

    async *stream(
        messages: BaseMessage[],
        _settings?: Partial<SETTING>
    ): AsyncGenerator<string, void, unknown> {
        this.abortController = new AbortController();
        const startTime = Date.now();
        Logger.structured("llm.request.start", {
            provider: this.id,
        });

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
            Logger.structured("llm.request.complete", {
                provider: this.id,
                latencyMs: Date.now() - startTime,
            });
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
            Logger.structured("llm.request.error", {
                provider: this.id,
                errorType: (error as Error).name || "Error",
                errorMessage: (error as Error).message || String(error),
            });
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
