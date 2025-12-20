import * as z from "zod";

export const LLMProviderSchema = z.enum([
    "OpenAI",
    "Anthropic",
    "Gemini",
    "OpenAI-compatible",
    "OpenRouter",
    "Mock",
]);
/**
 * Parameters for controlling LLM text generation behavior.
 * All parameters are optional and can be adjusted based on the specific use case.
 * Refer to the documentation of the specific LLM provider for details on supported parameters.
 */
export const LLMGenerationParametersSchema = z.object({
    /**
     * Controls the randomness of the model's output.
     * Usually between 0 and 2, but can vary by model.
     */
    temperature: z.number().optional(),
    /**
     * Maximum number of input tokens to consider from the prompt.
     * Keep in mind that this is not exact, since it will calculate tokens based on
     * the tokenizator of the specific model being used.
     */
    maxInputTokens: z.number().int().min(1).optional(),
    /**
     * Maximum number of tokens to generate in the response.
     */
    maxOutputTokens: z.number().int().min(1).optional(),
    /**
     * Controls repetition in the generated text.
     */
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    /**
     * Controls presence of new topics in the generated text.
     */
    presencePenalty: z.number().min(-2).max(2).optional(),
    /**
     * Top-p (nucleus) sampling parameter.
     */
    topP: z.number().min(0).max(1).optional(),
    /**
     * Top-k sampling parameter.
     */
    topK: z.number().int().min(0).optional(),
    /**
     * Thinking level for reasoning models.
     * Usually token count, or textual description like "low", "medium", "high".
     */
    thinkingLevel: z.union([z.number().int().min(0), z.string()]).optional(),
});
export const LLMConfigSchema = z.object({
    /**
     * Unique identifier for the LLM configuration.
     */
    id: z.string().default(() => "LLMconfig-" + crypto.randomUUID()),
    /**
     * Human-readable name for the LLM configuration.
     * Just for easier identification.
     */
    name: z.string().default("New Model"),
    /**
     * Provider of the LLM service.
     * Defaults to "Mock" for testing purposes.
     */
    provider: LLMProviderSchema.default("Mock"),
    /**
     * API key for accessing the LLM service.
     * Optional, as some providers may not require it(self-hosted or mock providers).
     */
    apiKey: z.string().optional(),
    /**
     * Base URL for the LLM service API.
     * Overrides default endpoint for custom or self-hosted providers.
     */
    baseURL: z.string().optional(),
    /**
     * Specific model name or identifier to use with the provider.
     * Optional, as some configurations may use default models.
     */
    model: z.string().optional(),
    /**
     * Configuration parameters for text generation behavior.
     */
    generationParameters: LLMGenerationParametersSchema.default({}),
    /**
     * Whether this LLM configuration is enabled for use.
     */
    enabled: z.boolean().default(true),
});

/**
 * Configuration for system prompts to guide assistant behavior.
 * ChatML format. All prompts are required.
 */
export const PromptConfigSchema = z
    .object({
        /**
         * The general prompt to guide the behavior of the assistant.
         */
        generationPrompt: z.string().default("You are a helpful assistant."),
    })
    .default({
        generationPrompt: "You are a helpful assistant.",
    });

export const AdvancedConfigSchema = z
    .object({
        /**
         * Enables debug mode for more verbose logging and diagnostics.
         * Currently unused.
         */
        debug: z.boolean().default(false),
        /**
         * Enables experimental features that are still in development.
         * Use with caution as these features may be unstable.
         * Currently unused.
         */
        experimental: z.boolean().default(false),
    })
    .default({ debug: false, experimental: false });

export const SettingsSchema = z.object({
    /**
     * Theme preference for the application interface.
     */
    theme: z.enum(["light", "dark", "system"]).default("system"),
    /**
     * Identifier of the active persona.
     * Nullable means no persona is selected.
     * Keep in mind that user can't send messages without selecting a persona first.
     */
    activePersonaId: z.string().nullable().default(null),
    /**
     * List of configured LLMs available for use.
     * Can be empty if no LLMs are set up.
     */
    llmConfigs: z.array(LLMConfigSchema).default([]),
    /**
     * ID of the currently active LLM configuration.
     * Used by chatStore to determine which provider to use.
     * Nullable means no config is active.
     */
    activeLLMConfigId: z.string().nullable().default(null),
    /**
     * Prompt configuration to guide assistant behavior.
     */
    prompt: PromptConfigSchema,
    /**
     * Advanced settings for the application.
     */
    advanced: AdvancedConfigSchema,
});

/**
 * Represents application settings.
 */
export type Settings = z.infer<typeof SettingsSchema>;
export type LLMConfig = z.infer<typeof LLMConfigSchema>;
export type LLMProvider = z.infer<typeof LLMProviderSchema>;
export type PromptConfig = z.infer<typeof PromptConfigSchema>;
export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;
