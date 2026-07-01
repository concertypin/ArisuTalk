/**
 * Token Counter Utility
 * Provides approximate token counting and cost estimation for text inputs.
 *
 * Uses a heuristic: ~1 token per 4 characters (byte-length aware via TextEncoder).
 * This is a rough approximation — actual tokenization depends on the model's tokenizer.
 * For production use, consider integrating tiktoken or a model-specific tokenizer.
 */

/**
 * Approximate cost per 1K tokens for various models (in USD).
 * Values are typical API pricing for input tokens.
 */
const MODEL_COST_PER_1K: Record<string, number> = {
    // OpenAI
    "gpt-4o": 0.0025,
    "gpt-4o-mini": 0.00015,
    "gpt-4": 0.03,
    "gpt-4-turbo": 0.01,
    "gpt-3.5-turbo": 0.0005,
    // Anthropic
    "claude-3-opus": 0.015,
    "claude-3-sonnet": 0.003,
    "claude-3-haiku": 0.00025,
    "claude-3-5-sonnet": 0.003,
    // Google
    "gemini-1.5-pro": 0.00125,
    "gemini-1.5-flash": 0.000075,
    // Default fallback
    default: 0.002,
};

/** Default model for cost estimation when none is specified. */
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * Count the approximate number of tokens in a text string.
 * Uses a heuristic of 1 token per 4 bytes (via TextEncoder for accurate byte length).
 *
 * @param text - The text to count tokens for.
 * @returns Approximate number of tokens.
 */
export function countTokens(text: string): number {
    if (!text) return 0;
    // Use TextEncoder for byte-accurate length (handles UTF-8 multi-byte characters)
    const bytes = new TextEncoder().encode(text).length;
    // Approx 1 token per 4 bytes (claude/gpt tokenizers average ~3.5-4.5 chars per token)
    return Math.ceil(bytes / 4);
}

/**
 * Estimate the token cost for a given text string.
 *
 * @param text - The text to estimate cost for.
 * @param model - Optional model identifier (defaults to "gpt-4o-mini").
 * @returns Object containing token count and estimated cost in USD.
 */
export function estimateTokenCost(text: string, model?: string): { tokens: number; cost: number } {
    const tokens = countTokens(text);
    const resolvedModel = model ?? DEFAULT_MODEL;
    const rate = MODEL_COST_PER_1K[resolvedModel] ?? MODEL_COST_PER_1K.default;
    const cost = (tokens / 1000) * rate;
    return { tokens, cost };
}
