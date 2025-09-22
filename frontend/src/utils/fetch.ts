/**
 * @fileoverview A wrapper around the fetch API that adds CORS proxy if needed.
 */

/**
 * CORS proxy URL from environment variable (if string).
 * If not set, requests will be made directly to the target URL.
 * @example 'https://cors.back.arisutalk.moe/proxy'
 * It receives the target URL as `url` header, with URL-encoded value.
 */
const proxy: string | undefined = import.meta.env.VITE_CORS_PROXY;

/**
 * Host URL from environment variable (if string).
 * Requests to this URL will not use the CORS proxy.
 * @example 'https://dev.arisutalk.moe'
 */
const host = import.meta.env.VITE_HOST_URL;

/**
 * List of allowed origins that provides CORS headers.
 * Requests to these origins will not use the CORS proxy.
 * @see
 */
const allowedOrigins = [
    "https://openrouter.ai",
    "https://api.openai.com",
    "https://generativelanguage.googleapis.com",
    "https://image.novelai.net",
];

/**
 * Native fetch function without CORS proxy.
 * Well, it's just window.fetch.
 */
export const fetchNative = window.fetch.bind(window);

/**
 * Fetch wrapper that adds CORS proxy if needed.
 * @param input The URL to fetch.
 * @param init Fetch options. You can add `corsProxy` boolean option to force or disable proxy.
 * @returns The fetch response.
 */
export default async function fetch(
    input: string,
    init?: RequestInit & { corsProxy?: boolean },
): Promise<Response> {
    // If proxy is set and the request is not to the host URL, use the proxy.
    if (proxy && checkProxyNeeded(input, init)) {
        const proxiedUrl = new URL(proxy);
        const headers = new Headers(init?.headers || {});
        headers.set("url", encodeURIComponent(input));
        return window.fetch(proxiedUrl.toString(), {
            ...init,
            headers,
        }).catch(() => window.fetch(input, init)) // Fallback to direct fetch on error
    }
    // No proxy, just fetch directly.
    return window.fetch(input, init);
}

function checkProxyNeeded(
    input: string,
    init?: { corsProxy?: boolean },
): boolean {
    // It checks if the request should go through the CORS proxy.
    // Priority: init.corsProxy > user setting > same-origin check > allowed origins

    if (init?.corsProxy !== undefined) return init.corsProxy; // Explicitly set, use it.

    if (window.personaApp?.state.settings.experimental.enableCorsProxy != true)
        return false; // User disabled CORS proxy in settings. Since this is experimental, respect it.

    if (!host || typeof host !== "string") {
        if (!import.meta.env.DEV)
            // Complaining on production
            console.warn(
                "CORS proxy is disabled because VITE_HOST_URL is not set or not a string." +
                "Setting it makes requests to the host URL avoid using the CORS proxy.",
            );
        // Complaining less on development
        else
            console.warn(
                "CORS proxy is disabled because VITE_HOST_URL is not set or not a string.",
            );
        return false; // No host URL, don't use proxy.
    }

    if (input.startsWith(host)) return false; // Request is same-origin, no proxy needed.

    if (
        input.startsWith("/") ||
        input.startsWith("./") ||
        input.startsWith("../")
    )
        return false; // Relative path, same-origin, no proxy needed.

    if (!input.startsWith("http:") && !input.startsWith("https:")) return false; // Non-http(s) URL, no proxy needed.

    // Check against allowed origins.
    for (const origin of allowedOrigins)
        if (input.startsWith(origin))
            return false; // Allowed origin, no proxy needed.

    try {
        const url = new URL(input);
        const hostUrl = new URL(host);
        return url.origin !== hostUrl.origin; // Use proxy if origins differ.
    } catch (e) {
        console.warn(`Could not parse URL, letting native fetch handle it: ${input}`);
        return false; // Don't use proxy for invalid URLs.
    }
}
