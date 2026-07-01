/**
 * @module API Client
 * Backend API client for communicating with the ArisuTalk Phonebook backend.
 * Uses Clerk JWTs for authentication when Clerk is available,
 * and falls back to unauthenticated requests otherwise.
 */

import { Logger } from "@common/logger/Logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a successful API response carrying data. */
export interface ApiSuccessResponse<T> {
    ok: true;
    status: number;
    data: T;
}

/** Shape of a failed API response with an error message. */
export interface ApiErrorResponse {
    ok: false;
    status: number;
    error: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ---------------------------------------------------------------------------
// Auth token management
// ---------------------------------------------------------------------------

/**
 * A function that returns a Promise resolving to an auth token string (or null).
 * Consumers (e.g. a Clerk initialisation routine) call `setTokenProvider` once
 * to wire up authentication.
 */
let tokenProvider: (() => Promise<string | null>) | null = null;

/**
 * Register a function that supplies a bearer token for API requests.
 * The token provider is called right before every authenticated request.
 *
 * @example
 * ```ts
 * import { setTokenProvider } from "@/lib/api/client";
 *
 * // After Clerk has loaded:
 * setTokenProvider(async () => {
 *     try {
 *         const token = await window.Clerk.session?.getToken();
 *         return token ?? null;
 *     } catch {
 *         return null;
 *     }
 * });
 * ```
 */
export function setTokenProvider(provider: (() => Promise<string | null>) | null): void {
    tokenProvider = provider;
}

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://phonebook.back.arisutalk.moe";

/** Resolve the phonebook API base URL from env or fallback. */
function resolveBaseUrl(): string {
    return import.meta.env.VITE_PHONEBOOK_BASE_URL || DEFAULT_BASE_URL;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Try to extract a human-readable "message" string from an unknown response
 * body.  Uses runtime narrowing so no unchecked cast is needed.
 */
function tryExtractErrorMessage(value: unknown): string | null {
    if (typeof value !== "object" || value === null) return null;
    if (!("message" in value)) return null;
    const msg: unknown = value.message;
    return typeof msg === "string" ? msg : null;
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

/**
 * Internal low-level request helper.
 * Handles URL construction, auth header injection, JSON parsing, and error
 * normalisation.
 */
async function request<T>(
    method: string,
    path: string,
    options?: {
        body?: unknown;
        /** FormData body — exclusive with `body`. */
        formData?: FormData;
        /** Additional headers to merge. */
        headers?: Record<string, string>;
        /** When `true` the response is returned as-is instead of being parsed. */
        raw?: boolean;
    }
): Promise<ApiResponse<T>> {
    const baseUrl = resolveBaseUrl();
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
        ...options?.headers,
    };

    // Attach auth token when available
    if (tokenProvider) {
        try {
            const token = await tokenProvider();
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
        } catch (err) {
            Logger.warn("[API] Failed to retrieve auth token", err);
        }
    }

    // Set JSON content-type unless we're sending FormData
    if (!options?.formData && options?.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    let body: BodyInit | undefined;
    if (options?.formData) {
        body = options.formData;
    } else if (options?.body !== undefined) {
        body = JSON.stringify(options.body);
    }

    let response: Response;
    try {
        response = await fetch(url, { method, headers, body });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        Logger.error(`[API] ${method} ${path} failed — ${message}`);
        return { ok: false, status: 0, error: message };
    }

    // Raw mode – return the Response object wrapped in ApiSuccessResponse
    if (options?.raw) {
        return { ok: true, status: response.status, data: response as unknown as T };
    }

    // No-content (204) – return ok with null data
    if (response.status === 204) {
        return { ok: true, status: 204, data: null as unknown as T };
    }

    // Try to parse JSON body
    let parsed: unknown;
    const textBody = await response.text();
    try {
        parsed = JSON.parse(textBody);
    } catch {
        // Response is not JSON – treat as error with the raw text
        return {
            ok: false,
            status: response.status,
            error: textBody || `Request failed with status ${response.status}`,
        };
    }

    if (!response.ok) {
        const errorMsg =
            tryExtractErrorMessage(parsed) ?? `Request failed with status ${response.status}`;
        return { ok: false, status: response.status, error: errorMsg };
    }

    return { ok: true, status: response.status, data: parsed as T };
}

// ---------------------------------------------------------------------------
// Public HTTP-method shorthands
// ---------------------------------------------------------------------------

/** GET request. */
export async function get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>("GET", path);
}

/** POST request with optional JSON body. */
export async function post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>("POST", path, { body });
}

/** PATCH request with optional JSON body. */
export async function patch<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, { body });
}

/** DELETE request. */
export async function del<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path);
}

/**
 * Raw GET request – returns the Response object without JSON parsing.
 * Useful for downloading blobs or streaming.
 */
export async function getRaw(path: string): Promise<ApiResponse<Response>> {
    return request<Response>("GET", path, { raw: true });
}

/**
 * Upload a file via multipart/form-data (POST).
 */
export async function uploadBlob<T = unknown>(
    path: string,
    blob: Blob,
    filename?: string
): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", blob, filename || "blob");
    return request<T>("POST", path, { formData });
}
