import {
    ChatProvider,
    type CommonChatSettings,
    type ProviderSettings,
    type IChatProviderFactory,
} from "@/lib/interfaces/IChatProvider";
import { type BaseMessage } from "@langchain/core/messages";
import type { ChatGoogleGenerativeAI } from "@langchain/google-genai";

type GeminiSettings = CommonChatSettings & ProviderSettings["GEMINI"];

export class GeminiChatProvider extends ChatProvider<"GEMINI"> {
    id = "GEMINI";
    name = "Google Gemini";
    description = "Google's Gemini models";

    private model: ChatGoogleGenerativeAI;
    private abortController: AbortController | null = null;

    private constructor(model: ChatGoogleGenerativeAI) {
        super();
        this.model = model;
    }

    static factory: IChatProviderFactory<"GEMINI"> = {
        connect: async (settings: GeminiSettings) => {
            const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
            const model = new ChatGoogleGenerativeAI({
                apiKey: settings.apiKey,
                model: settings.model || "gemini-pro",
                temperature: settings.temperature,
                maxOutputTokens: settings.maxOutputTokens,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
                safetySettings: settings.safetySettings as any,
            });
            return new GeminiChatProvider(model);
        },
    };

    async disconnect(): Promise<void> {
        // No persistent connection to close for REST API
    }

    async generate(messages: BaseMessage[], _settings?: Partial<GeminiSettings>): Promise<string> {
        // If settings are provided, we might need to bind them or create a new instance.
        // For simplicity, we assume per-request settings (like temperature) might need a new model instance
        // or using .bind() if LangChain supports it for those specific params.
        // For now, we use the instance as is.
        const response = await this.model.invoke(messages);
        return response.content as string;
    }

    async *stream(
        messages: BaseMessage[],
        _settings?: Partial<GeminiSettings>
    ): AsyncGenerator<string, void, unknown> {
        this.abortController = new AbortController();

        // Pass signal to LangChain call if supported, or handle abort manually in loop
        const stream = await this.model.stream(messages, {
            signal: this.abortController.signal,
        });

        try {
            for await (const chunk of stream) {
                yield chunk.content as string;
            }
        } catch (error: unknown) {
            if (error instanceof Error && error.name === "AbortError") {
                // Ignore abort error
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
        return !!this.model;
    }
}
