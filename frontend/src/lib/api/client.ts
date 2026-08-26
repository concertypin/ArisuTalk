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

let tokenProvider: (() => Promise<string | null>) | null = null;

/**
 * Register a function that supplies a bearer token for API requests.
 * The token provider is called right before every authenticated request.
 */
export function setTokenProvider(provider: (() => Promise<string | null>) | null): void {
    tokenProvider = provider;
}

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = "https://phonebook.back.arisutalk.moe";

function resolveBaseUrl(): string {
    return import.meta.env.VITE_PHONEBOOK_BASE_URL || DEFAULT_BASE_URL;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tryExtractErrorMessage(value: unknown): string | null {
    if (typeof value !== "object" || value === null) return null;
    if (!("message" in value)) return null;
    const msg: unknown = value.message;
    return typeof msg === "string" ? msg : null;
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------

type RequestOptions = {
    body?: unknown;
    formData?: FormData;
    headers?: Record<string, string>;
    raw?: boolean;
};

// Overload 1: raw mode returns Response
async function request(
    method: string,
    path: string,
    options: { raw: true } & RequestOptions
): Promise<ApiSuccessResponse<Response> | ApiErrorResponse>;
// Overload 2: normal mode parses JSON as T
async function request<T>(
    method: string,
    path: string,
    options?: RequestOptions
): Promise<ApiResponse<T>>;
// Implementation with widened return type to satisfy all overload branches
async function request(
    method: string,
    path: string,
    options?: RequestOptions
): Promise<ApiResponse<unknown>> {
    const baseUrl = resolveBaseUrl();
    const url = `${baseUrl}${path}`;

    const headers: Record<string, string> = {
        ...options?.headers,
    };

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

    // Raw mode – the overload guarantees callers see ApiSuccessResponse<Response>
    if (options?.raw) {
        return {
            ok: true,
            status: response.status,
            data: response,
        };
    }

    // No-content (204) – return ok with null data
    if (response.status === 204) {
        return { ok: true, status: 204, data: null };
    }

    // Try to parse JSON body
    let parsed: unknown;
    const textBody = await response.text();
    try {
        parsed = JSON.parse(textBody);
    } catch {
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

    return { ok: true, status: response.status, data: parsed };
}

// ---------------------------------------------------------------------------
// Public HTTP-method shorthands
// ---------------------------------------------------------------------------

export async function get<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>("GET", path);
}

export async function post<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>("POST", path, { body });
}

export async function patch<T = unknown>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, { body });
}

export async function del<T = unknown>(path: string): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path);
}

export async function getRaw(path: string): Promise<ApiResponse<Response>> {
    return request<Response>("GET", path, { raw: true });
}

export async function uploadBlob<T = unknown>(
    path: string,
    blob: Blob,
    filename?: string
): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", blob, filename || "blob");
    return request<T>("POST", path, { formData });
}
