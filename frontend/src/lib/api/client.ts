/**
 * @fileoverview API client for backend communication.
 * Wraps fetch with common configuration and error handling.
 */

/** API response wrapper */
export type ApiResponse<T> ={
    data: T | null;
    error: string;
    status: number;
}| {
    data: T;
    status: number;
}

/** Base API configuration */

/**
 * Make an API request with standard error handling.
 * Fetch API should not be used directly, since it can't handle CORS.
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    throw new Error('Not implemented');
}

/** GET request shorthand */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, { method: 'GET' });
}

/** POST request shorthand */
export async function post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/** PATCH request shorthand */
export async function patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/** DELETE request shorthand */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
}
