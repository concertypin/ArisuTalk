import type { BaseMessage } from "@langchain/core/messages";
import type { LLMConfig } from "../types/IDataModel";

/**
 * Common settings shared across all chat providers.
 */
export type CommonChatSettings = Pick<
    Partial<LLMConfig>,
    "apiKey" | "baseURL" | "generationParameters" | "model"
>;
type GeminiSafetySetting =
    | "HARM_CATEGORY_UNSPECIFIED"
    | "HARM_CATEGORY_HATE_SPEECH"
    | "HARM_CATEGORY_SEXUALLY_EXPLICIT"
    | "HARM_CATEGORY_HARASSMENT"
    | "HARM_CATEGORY_DANGEROUS_CONTENT"
    | "HARM_CATEGORY_CIVIC_INTEGRITY";

type GeminiHarmBlockThreshold =
    | "HARM_BLOCK_THRESHOLD_UNSPECIFIED"
    | "BLOCK_LOW_AND_ABOVE"
    | "BLOCK_MEDIUM_AND_ABOVE"
    | "BLOCK_ONLY_HIGH"
    | "BLOCK_NONE";
/**
 * Provider-specific settings.
 */
export interface ProviderSettings {
    /**
     * OpenAI settings (also used for OpenAI-compatible APIs)
     */
    OPENAI: {};
    /**
     * Gemini settings
     */
    GEMINI: {
        safetySettings?: {
            category: GeminiSafetySetting;
            threshold: GeminiHarmBlockThreshold;
        }[];
    };
    /**
     * Anthropic settings
     */
    ANTHROPIC: {};
    /** OpenRouter settings */
    OPENROUTER: {
        baseUrl?: string;
    };
    /** Mock provider settings for testing */
    MOCK: {
        /**
         * Delay in milliseconds between responses.
         */
        mockDelay?: number;
        /**
         * Predefined responses to return.
         */
        responses?: string[];
    };
}

export type ProviderType = keyof ProviderSettings;

/**
 * Interface for the static side of a Chat Provider (Factory).
 * Enforces the static connect method pattern.
 */
export interface IChatProviderFactory<T extends ProviderType> {
    /**
     * static factory method to create and initialize the provider.
     * @param settings - The initial settings for the provider (common + specific).
     * @returns Promise resolving to an initialized instance.
     */
    connect(settings: CommonChatSettings & ProviderSettings[T]): Promise<ChatProvider<T>>;
}

/**
 * Abstract base class for a Chat Service Provider.
 * Abstraction layer for interacting with different LLM providers (e.g., OpenAI, Anthropic, Ollama).
 * Users must use the static `connect` factory method from the implementation to get an instance.
 */
export abstract class ChatProvider<
    T extends ProviderType,
    SETTING extends CommonChatSettings & ProviderSettings[T] = CommonChatSettings &
        ProviderSettings[T],
> {
    /** Unique identifier for the provider. */
    abstract id: string;
    /** Display name of the provider. */
    abstract name: string;
    /** Description of the provider capabilities. */
    abstract description: string;

    /**
     * Protected constructor to force usage of static factory methods.
     */
    protected constructor() {}

    /**
     * Disconnects from the provider.
     */
    abstract disconnect(): Promise<void>;

    /**
     * Generates a single response for the given messages.
     * @param messages - Array of messages to generate response from.
     * @param settings - Optional query-specific settings (overrides connection config).
     * @returns Promise resolving to the generated text.
     */
    abstract generate(messages: BaseMessage[], settings?: Partial<SETTING>): Promise<string>;

    /**
     * Streams the response for the given messages.
     * @param messages - Array of messages.
     * @param settings - Optional query-specific settings (overrides connection config).
     * @returns AsyncGenerator yielding chunks of generated text.
     */
    abstract stream(
        messages: BaseMessage[],
        settings?: Partial<SETTING>
    ): AsyncGenerator<string, void, unknown>;

    /**
     * Aborts the currently running generation request.
     */
    abstract abort(): void;

    /**
     * Checks if the provider is ready/connected.
     * @returns True if ready, false otherwise.
     */
    abstract isReady(): boolean;
}
