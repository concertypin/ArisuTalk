/**
 * @fileoverview Global application state using Svelte 5 runes.
 * Centralized state that needs to be shared across features.
 */

/** App-wide loading state */
let isLoading = $state(false);

/** App-wide error state */
let globalError = $state<string | null>(null);

/**
 * Set global loading state
 */
export function setLoading(loading: boolean): void {
    isLoading = loading;
}

/**
 * Get loading state (reactive)
 */
export function getLoading(): boolean {
    return isLoading;
}

/**
 * Set global error
 */
export function setError(error: string | null): void {
    globalError = error;
}

/**
 * Get error state (reactive)
 */
export function getError(): string | null {
    return globalError;
}

/**
 * Clear all global state (useful for logout/reset)
 */
export function clearAppState(): void {
    isLoading = false;
    globalError = null;
}
