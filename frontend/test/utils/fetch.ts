/**
 * @fileoverview Helpers for tests that inspect the arguments a mocked `fetch` was called with.
 */

/**
 * Reads the URL out of the first argument of a `fetch` call.
 * @param input - The `input` argument that was passed to `fetch`.
 * @returns The URL as a string.
 */
export function requestUrl(input: string | URL | Request): string {
    return input instanceof Request ? input.url : String(input);
}
