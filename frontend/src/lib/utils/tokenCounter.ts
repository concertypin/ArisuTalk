/**
 * Token Counter Utility
 *
 * Provides approximate token estimation and cost calculation for text inputs.
 *
 * ## Token estimation
 * Uses a byte-length heuristic (~1 token per 4 bytes via `TextEncoder`).
 * This is a **rough approximation** — actual tokenization depends on the model's
 * specific tokenizer (BPE, WordPiece, etc.). For production-level accuracy,
 * swap in a real tokenizer via the {@link TokenCountProvider} interface.
 *
 * ## Model pricing
 * Default prices are **approximate** and may be stale. Use {@link setModelCost}
 * to update at runtime, or configure via the settings UI.
 *
 * @module tokenCounter
 */

/**
 * Interface for pluggable token counting implementations.
 * Implement this to swap in a real tokenizer (e.g. tiktoken, `@xenova/transformers`).
 */
export interface TokenCountProvider {
    /** Count the exact number of tokens in a text string. */
    count(text: string): number;
    /** Optional name for debugging/logging. */
    readonly name?: string;
}

/**
 * Approximate cost per 1K tokens for various models (in USD).
 * Values are typical API pricing for input tokens and are **estimates only**.
 * Use {@link setModelCost} to override at runtime.
 *
 * @remarks The list is intentionally minimal — model pricing changes frequently.
 * Users should configure custom costs via settings or `setModelCost()`.
 */
const MODEL_COST_PER_1K: Record<string, number> = {
    // OpenAI
    "gpt-4o": 0.0025,
    "gpt-4o-mini": 0.00015,
    // Anthropic
    "claude-3-5-sonnet": 0.003,
    "claude-3-haiku": 0.00025,
    // Default fallback
    default: 0.002,
};

/** Default model for cost estimation when none is specified. */
const DEFAULT_MODEL = "gpt-4o-mini";

/**
 * The active token count provider.
 * Defaults to the built-in byte-length heuristic.
 */
let tokenProvider: TokenCountProvider = {
    count(text: string): number {
        if (!text) return 0;
        const bytes = new TextEncoder().encode(text).length;
        return Math.ceil(bytes / 4);
    },
    name: "byte-heuristic",
};

/**
 * Override the token counting implementation.
 * Pass a custom {@link TokenCountProvider} to use a real tokenizer.
 *
 * @example
 * ```ts
 * setTokenProvider({
 *   count(text) { return myTokenizer.count(text); },
 *   name: "tiktoken",
 * });
 * ```
 */
export function setTokenProvider(provider: TokenCountProvider): void {
    tokenProvider = provider;
}

/**
 * Estimate the approximate number of tokens in a text string.
 * Uses the active {@link TokenCountProvider} (default: byte-length heuristic
 * of ~1 token per 4 bytes via `TextEncoder`).
 *
 * **Limitations:**
 * - The default heuristic assumes ~4 bytes/token, which varies by language and model.
 * - CJK characters average 1–2 tokens each (not ~1 token/4 bytes).
 * - Code, numbers, and special tokens (e.g. `<|endoftext|>`) are not handled.
 * - For accurate counts, provide a real tokenizer via {@link setTokenProvider}.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated number of tokens.
 */
export function estimateTokens(text: string): number {
    return tokenProvider.count(text);
}

/**
 * Estimate the token cost for a given text string.
 *
 * @param text - The text to estimate cost for.
 * @param model - Optional model identifier (defaults to "gpt-4o-mini").
 * @returns Object containing token count and estimated cost in USD.
 */
export function estimateTokenCost(text: string, model?: string): { tokens: number; cost: number } {
    const tokens = estimateTokens(text);
    const resolvedModel = model ?? DEFAULT_MODEL;
    const rate = MODEL_COST_PER_1K[resolvedModel] ?? MODEL_COST_PER_1K.default;
    const cost = (tokens / 1000) * rate;
    return { tokens, cost };
}

/**
 * Update or add a model's per-1K-token cost at runtime.
 * Useful when API pricing changes or users want custom rates.
 *
 * @param model - The model identifier (e.g. `"gpt-4o"`, `"claude-3-opus"`).
 * @param costPer1K - Cost in USD per 1,000 tokens.
 *
 * @example
 * ```ts
 * setModelCost("my-custom-model", 0.001);
 * ```
 */
export function setModelCost(model: string, costPer1K: number): void {
    MODEL_COST_PER_1K[model] = costPer1K;
}
