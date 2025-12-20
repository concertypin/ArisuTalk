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
        async connect(settings: GeminiSettings) {
            const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
            type ClientOption = ConstructorParameters<typeof ChatGoogleGenerativeAI>["0"];
            type SafetySetting = Required<ClientOption>["safetySettings"][number];
            if (!settings.model) {
                throw new Error("Model must be specified for GeminiChatProvider.");
            }
            const modelConfig: ClientOption = {
                apiKey: settings.apiKey,
                model: settings.model,
                temperature: settings.generationParameters?.temperature,
                maxOutputTokens: settings.generationParameters?.maxOutputTokens,
                safetySettings: settings.safetySettings?.map((i) => ({
                    // Q: Is it safe?
                    // A: Check here: https://tsplay.dev/w2qDbW
                    category: i.category as SafetySetting["category"],
                    threshold: i.threshold as SafetySetting["threshold"],
                })),
                thinkingConfig: {
                    includeThoughts: true,
                },
            };
            if (typeof settings.generationParameters?.thinkingLevel === "string") {
                modelConfig.thinkingConfig = {
                    ...modelConfig.thinkingConfig,
                    thinkingLevel: settings.generationParameters
                        .thinkingLevel as Required<ClientOption>["thinkingConfig"]["thinkingLevel"],
                };
            } else if (typeof settings.generationParameters?.thinkingLevel === "number") {
                modelConfig.thinkingConfig = {
                    ...modelConfig.thinkingConfig,
                    thinkingBudget: settings.generationParameters.thinkingLevel,
                };
            } else if (settings.generationParameters?.thinkingLevel === undefined) {
                // Do nothing, use default
            } else {
                // Fallback, should not reach here due to prior check
                throw new Error("Invalid thinkingLevel for GeminiChatProvider.");
            }
            const model = new ChatGoogleGenerativeAI(modelConfig);
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
                yield chunk.text;
            }
        } catch (error: unknown) {
            if (error instanceof DOMException && error.name === "AbortError") {
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
