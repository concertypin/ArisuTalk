import { type Context, Hono, type Next } from "hono";
import { cors as corsHono } from "hono/cors";

/**
 * Allowed origins for CORS
 * It allows CORS requests from these origins
 * Keep in mind that ports are ignored in wildcard subdomains,
 * which means that all ports from the origin are allowed
 * Wildcards are not a regex
 */
const allowedOrigins = [
    "arisutalk.moe",
    "localhost",
    "127.0.0.1",
    "host.*.internal",
];

/**
 * CORS middleware for Hono.
 * Handles CORS with dynamic origin resolution based on allowed origins.
 * @see allowedOrigins
 * @example new Hono().use("*", cors);
 * @returns Hono middleware that handles CORS with dynamic origin resolution
 */
export async function cors<Ctx extends Context>(c: Ctx, next: Next) {
    return corsHono({
        origin: originResolve,
        credentials: true,
    })(c, next);
}

/**
 * Resolves the origin for CORS based on allowed origins.
 * @param origin The origin from the request
 * @returns The resolved origin if allowed, otherwise an empty string(disallowing CORS, handled by hono/cors)
 */
function originResolve(origin: string) {
    // No CORS headers for non-browser requests
    if (!origin) return "";

    const url = new URL(
        origin
            .replace(/\/$/, "") // Remove trailing slash if present
            .replace(/(:\d+)$/, "") // Remove port if present
    );

    if (
        allowedOrigins.some((allowed) => {
            // Case 1: Not a wildcard pattern, check for exact match
            if (!allowed.includes("*")) return url.hostname === allowed;

            // Case 2: Standard subdomain wildcard (e.g., "*.example.com")
            if (allowed.startsWith("*.")) {
                const domain = allowed.slice(2);
                return (
                    url.hostname === domain ||
                    url.hostname.endsWith(`.${domain}`)
                );
            }

            // Case 3: Infix wildcard (e.g., "host.*.internal")
            // Convert to a regular expression
            const regexPattern =
                "^" +
                allowed
                    .replace(/\./g, "\\.") // Escape dots for regex
                    .replace(/\*/g, "[a-zA-Z0-9-]+") + // Match valid hostname characters
                "$";

            const regex = new RegExp(regexPattern);
            return regex.test(url.hostname);
        })
    ) {
        return origin; // Origin is allowed, return it
    }

    // No match found, disallow the origin
    return "";
}
