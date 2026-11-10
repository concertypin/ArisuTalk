/**
 * Token Counter Utility
 *
 * Provides approximate token estimation for text inputs.
 *
 * ## Token estimation
 * Uses a byte-length heuristic (~1 token per 4 bytes via `TextEncoder`).
 * This is a **rough approximation** — actual tokenization depends on the model's
 * specific tokenizer (BPE, WordPiece, etc.). For production-level accuracy,
 * swap in a real tokenizer via the {@link TokenCountProvider} interface.
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
 * @todo Should be actual tokenization.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated number of tokens.
 */
export function estimateTokens(text: string): number {
    return tokenProvider.count(text);
}
