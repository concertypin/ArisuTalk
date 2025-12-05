/**
 * Model utility functions for handling different AI model requirements
 */

/**
 * Models that require 'max_completion_tokens' instead of 'max_tokens'
 * These are newer OpenAI models that use the updated API parameter format
 */
const MODELS_USING_MAX_COMPLETION_TOKENS: string[] = [
    // GPT-5 series
    "gpt-5",
    "gpt-5-mini",
    "gpt-5-nano",
    // o3 series
    "o3",
    "o4-mini",
    "o3-pro",
];

/**
 * Determines if a model requires 'max_completion_tokens' instead of 'max_tokens'
 */
export function shouldUseMaxCompletionTokens(model: string): boolean {
    return MODELS_USING_MAX_COMPLETION_TOKENS.includes(model);
}

/**
 * Gets the correct token limit parameter name for a given model
 */
export function getTokenLimitParameter(model: string, tokenLimit: number): { max_tokens: number } | { max_completion_tokens: number } {
    if (shouldUseMaxCompletionTokens(model)) {
        return { max_completion_tokens: tokenLimit };
    }
    return { max_tokens: tokenLimit };
}
